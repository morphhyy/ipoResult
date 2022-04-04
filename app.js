import fetch from "node-fetch";
import boidInfo from "./data/data.js";
import colors from "colors";
import promptSync from "prompt-sync";
import { createWorker, OEM } from "tesseract.js";

const prompt = promptSync();
const url = "https://iporesult.cdsc.com.np/";

const getData = () => {
  return fetch(url + "result/companyShares/fileUploaded")
    .then((res) => res.json())
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
};

const workers = [];
boidInfo.map((user) => {
  if (user.boid)
    workers.push(
      createWorker({
        cachePath: ".",
        cacheMethod: "refresh",
      })
    );
});

getData()
  .then((data) => {
    if (data.error) throw "Data Not Found!";
    const details = [];
    data.body.companyShareList.map((company) => {
      details.push({ id: company.id, name: company.name });
    });

    details.map((a) => console.log(a.id, "=>", a.name));
    console.log("");
    const userID = prompt("Choose: ");

    const checking = details.filter((a) => a.id == userID)[0];
    console.log("Checking Result of", `${checking.name}`.cyan.underline, "\n");

    const result = async (worker, v) => {
      let userCaptcha,
        captcha,
        captchaIdentifier = null;

      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      await worker.setParameters({
        init_oem: OEM.TESSERACT_LSTM_COMBINED,
        tessedit_char_whitelist: "0123456789",
      });

      while (!/^(\d{5})$/.test(userCaptcha)) {
        let data = await getData();
        ({ captcha, captchaIdentifier } = data.body.captchaData);
        let captchaImg = Buffer.from(captcha, "base64");
        let {
          data: { text },
        } = await worker.recognize(captchaImg);
        userCaptcha = text.replace(/[^0-9]/g, "");
      }
      await worker.terminate();

      return fetch(url + "result/result/check", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyShareId: userID,
          boid: v,
          userCaptcha: userCaptcha,
          captchaIdentifier: captchaIdentifier,
        }),
        method: "POST",
      })
        .then((res) => res.json())
        .catch((error) => {
          console.log("Something went wrong!".red.bold.underline);
        });
    };

    let workerIndex = 0;
    boidInfo.map((user) => {
      if (user.boid) {
        result(workers[workerIndex++], user.boid).then((r) =>
          typeof r === "undefined"
            ? console.log(
                `${user.name} => Possible Error: Incorrect BOID`.yellow + "\n"
              )
            : r.success === true
            ? console.log(
                `Congratulations! ${
                  user.name
                }. IPO Alloted. Alloted quantity: ${r.message.split(" ")[6]} `
                  .bgGreen.black + "\n"
              )
            : r.success === false &&
              console.log(`${user.name} => Sorry not Alloted`.yellow + "\n")
        );
      }
    });
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
