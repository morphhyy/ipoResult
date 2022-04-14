import fetch from "node-fetch";
import boidInfo from "./data/data.js";
import colors from "colors";
import promptSync from "prompt-sync";
import { createSpinner } from "nanospinner";
import { config } from "dotenv";
import fs from "fs";

config();
const prompt = promptSync();
const url = "https://iporesult.cdsc.com.np/";
const numbers = {
  zero: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

const getData = () => {
  return fetch(url + "result/companyShares/fileUploaded")
    .then((res) => res.json())
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
};

const postData = async (userID, v, userCaptcha, captchaIdentifier) => {
  try {
    const res = await fetch(url + "result/result/check", {
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
    });
    return await res.json();
  } catch (error) {
    console.log("Something went wrong!".red.bold.underline);
  }
};

const solveCaptcha = async (buffer) => {
  try {
    let captcha = "";
    const data = await fetch(process.env.SPEECH_TO_TEXT_URL + "/v1/recognize", {
      method: "POST",
      headers: {
        "Content-Type": "audio/wav",
        Authorization:
          "Basic " +
          Buffer.from(
            `apikey:${process.env.SPEECH_TO_TEXT_IAM_APIKEY}`
          ).toString("base64"),
      },
      body: buffer,
    });

    const res = await data.json();
    const captchaWord = res.results[0].alternatives[0].transcript.split(" ");
    captchaWord.map((d) => {
      captcha += numbers[d];
    });
    return captcha;
  } catch (err) {
    console.error(err);
  }
};

getData()
  .then((data) => {
    if (data.error) throw "Data Not Found!";
    const details = [];
    data.body.companyShareList.map((company) => {
      details.push({ id: company.id, name: company.name });
    });

    details.map((a) => console.log(a.id, "=>", a.name));
    console.log("");
    const userID = prompt("Choose: ", "1");

    const checking = details.filter((a) => a.id == userID)[0];
    console.log("Checking Result of", `${checking.name}`.cyan.underline, "\n");

    const result = async (v, captchaSpinner) => {
      let userCaptcha,
        audioCaptcha,
        captchaIdentifier = null;

      while (!/^(\d{5})$/.test(userCaptcha)) {
        let data = await getData();
        ({ audioCaptcha, captchaIdentifier } = data.body.captchaData);
        let buffer = Buffer.from(audioCaptcha, "base64");

        userCaptcha = await solveCaptcha(buffer);
        userCaptcha = userCaptcha.replace(/[^0-9]/g, "");
      }

      let results = await postData(userID, v, userCaptcha, captchaIdentifier);
      if (
        results.message &&
        results.message !== "Invalid Captcha Provided. Please try again "
      ) {
        captchaSpinner.success({ text: "Completed!" });
        return results;
      }
    };

    boidInfo.map(async (user) => {
      if (user.boid) {
        const captchaSpinner = createSpinner("Solving CAPTCHA...").start();
        await sleep();
        result(user.boid, captchaSpinner).then((r) =>
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