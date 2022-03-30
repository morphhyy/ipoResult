import fetch from 'node-fetch'
import boidInfo from './data/data.js'
import colors from 'colors'
import promptSync from 'prompt-sync'
import terminalImage from 'terminal-image';

const prompt = promptSync()
const url = 'https://iporesult.cdsc.com.np/'

const getData = async () => {
  try {
    const res = await fetch(url + 'result/companyShares/fileUploaded')
    const data = await res.json()
    if (data.error) {
      console.log('Data Not Found!')
      process.exit(1)
    }
    return data
  } catch (err) {
    console.error('Error: ', err.message)
    process.exit(1)
  }
}

try {
  getData().then(async (data) => {
    const details = []
    data.body.companyShareList.map((company) => {
      details.push({ id: company.id, name: company.name })
    })

    details.map((a) => console.log(a.id, '=>', a.name))
    console.log('')
    const userID = prompt('Choose: ')

    const captchaData = data.body.captchaData

    const imgBuffer = Buffer.from(captchaData.captcha, 'base64')
    const captchaImg = await terminalImage.buffer(imgBuffer, {height: '50%', width: '50%'})
    console.log(captchaImg)
    const usercaptcha = prompt('Enter Captcha: ')
    const result = async (v) => {
      const res = await fetch(url + 'result/result/check', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: `{"companyShareId":"${userID}","boid":"${v}","userCaptcha":"${usercaptcha}","captchaIdentifier":"${captchaData.captchaIdentifier}"}`,
        method: 'POST',
      })
      try {
        const data = await res.json()
        return data
      } catch (error) {
        console.log('Something went wrong!'.red.bold.underline)
      }
    }

    const checking = details.filter((a) => a.id == userID)[0]
    console.log('Checking Result of', `${checking.name}`.cyan.underline, '\n')
    boidInfo.map((user) => {
      if (user.boid) {
        result(user.boid).then((r) =>
          typeof r === 'undefined'
            ? console.log(
                `${user.name} => Possible Error: Incorrect BOID`.yellow
              )
            : r.success === true
            ? console.log(
                `Congratulations! ${
                  user.name
                }. IPO Alloted. Alloted quantity: ${r.message.split(' ')[6]} `
                  .bgGreen.black
              )
            : r.success === false &&
              console.log(`${user.name} => Sorry not Alloted`.yellow)
        )
      }
    })
  })
} catch (err) {
  console.log('Error:', err)
  process.exit(1)
}
