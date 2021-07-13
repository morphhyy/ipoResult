import fetch from "node-fetch"
import ipo from './data.js'
import promptSync from 'prompt-sync';

const prompt = promptSync();
const url = 'https://iporesult.cdsc.com.np/'

const getData = async () => {
    const res = await fetch("https://iporesult.cdsc.com.np/result/companyShares/fileUploaded");
    const data = await res.json()
    return data
}

getData().then(data => {
    
    const details = []
    data.body.map(company => {
        details.push({id:company.id, name:company.name })
    })
    
    details.map(a => console.log(a.id, '=>', a.name))
    console.log('')
    const userID = prompt("Choose: ")

    const result = async (v) => {
        const res = await fetch("https://iporesult.cdsc.com.np/result/result/check", {
            "headers": {
                "Content-Type": "application/json"
            },
            "body": `{"companyShareId":"${userID}","boid":"${v}"}`,
            "method": "POST"
        });
        
        const data = await res.json();
        return data
    }

    const checking = details.filter(a => a.id == userID)[0]
    console.log(`\nChecking Result of ${checking.name}!\n`)
    ipo.map(user => {
        if(user.boid){
            result(user.boid).then(r => console.log(user.boid, '=>', r.message))
        }
    })
})

