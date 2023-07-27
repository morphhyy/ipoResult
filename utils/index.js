import fetch from 'node-fetch'
import https from 'https'

export const url = 'https://iporesult.cdsc.com.np/'

const numbers = {
    zero: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
}

export const agent = new https.Agent({
    rejectUnauthorized: false,
})

export const getData = async () => {
    const response = await fetch(url + 'result/companyShares/fileUploaded', {
        agent,
    })
    return response.json()
}

export const postData = async (userID, v, userCaptcha, captchaIdentifier) => {
    try {
        const res = await fetch(url + 'result/result/check', {
            agent,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                companyShareId: userID,
                boid: v,
                userCaptcha: userCaptcha,
                captchaIdentifier: captchaIdentifier,
            }),
            method: 'POST',
        })
        return await res.json()
    } catch (error) {
        console.log('Something went wrong!'.red.bold.underline)
    }
}

export const solveCaptcha = async (buffer) => {
    let captcha = ''
    const data = await fetch(process.env.SPEECH_TO_TEXT_URL + '/v1/recognize', {
        method: 'POST',
        headers: {
            'Content-Type': 'audio/wav',
            Authorization:
                'Basic ' +
                Buffer.from(
                    `apikey:${process.env.SPEECH_TO_TEXT_IAM_APIKEY}`
                ).toString('base64'),
        },
        body: buffer,
    })

    const res = await data.json()
    if (res.error) {
        console.log(`\nError: ${res.error}`.red.bold)
        process.exit(1)
    }
    const captchaWord = res.results[0].alternatives[0].transcript.split(' ')
    captchaWord.map((d) => {
        captcha += numbers[d]
    })
    return captcha
}

export const result = async (v, captchaSpinner, userID) => {
    let userCaptcha,
        audioCaptcha,
        captchaIdentifier = null

    while (!/^(\d{5})$/.test(userCaptcha)) {
        let data = await getData()
        ;({ audioCaptcha, captchaIdentifier } = data.body.captchaData)
        let buffer = Buffer.from(audioCaptcha, 'base64')

        userCaptcha = await solveCaptcha(buffer)
        userCaptcha = userCaptcha.replace(/[^0-9]/g, '')
    }

    let results = await postData(userID, v, userCaptcha, captchaIdentifier)

    if (!results) {
        throw new Error('Something went wrong!')
    }

    if (
        results.message &&
        results.message !== 'Invalid Captcha Provided. Please try again '
    ) {
        captchaSpinner.success({ text: 'Completed!' })
        return results
    }
}
