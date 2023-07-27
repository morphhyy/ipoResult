import boidInfo from './data/data.js'
import promptSync from 'prompt-sync'
import { createSpinner } from 'nanospinner'
import { config } from 'dotenv'
import colors from 'colors'
import { getData, result } from './utils/index.js'

colors.enable()
config()
const prompt = promptSync()

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms))

;(async () => {
    try {
        const data = await getData()
        if (data.error) {
            throw new Error('Data Not Found!')
        }
        const details = data.body.companyShareList.map((company) => {
            if (company.name.includes('FOREIGN EMPLOYMENT)')) {
                return
            }
            return { id: company.id, name: company.name }
        })

        details.map((a) => {
            if (!a || a.name.includes('FOREIGN EMPLOYMENT')) {
                return
            }

            console.log(a.id, '=>', a.name)
            return a.id, '=>', a.name
        })

        let userID = null
        try {
            userID = prompt('Choose: ')
        } catch (e) {
            userID = '1'
        }

        const checking = details.filter((a) => a?.id == userID)[0]

        console.log(
            '\nChecking Result of'.green,
            `${checking?.name}`.cyan.underline,
            'Please wait...'.yellow
        )

        boidInfo.map(async (user) => {
            if (!user) {
                return
            }
            if (user.boid) {
                const captchaSpinner =
                    createSpinner('Solving CAPTCHA...').start()
                await sleep()
                result(user?.boid, captchaSpinner, userID).then((r) =>
                    typeof r === 'undefined'
                        ? console.log(
                              `${user.name} => Possible Error: Incorrect BOID: ${user.boid}`
                                  .yellow + '\n'
                          )
                        : r.success === true
                        ? console.log(
                              `Congratulations! ${
                                  user.name
                              }. IPO Alloted. Alloted quantity: ${
                                  r.message.split(' ')[6]
                              } `.bgGreen.black + '\n'
                          )
                        : r.success === false &&
                          console.log(
                              `${user.name} => Sorry not Alloted`.yellow + '\n'
                          )
                )
            }
        })
    } catch (error) {
        console.error(`\nError: ${error.message}`.red)
        process.exit(1)
    }
})()
