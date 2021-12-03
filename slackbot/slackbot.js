const axios = require('axios')
const fs = require('fs')
const { WebClient } = require('@slack/web-api')

const slackToken = process.env.SLACK_TOKEN
const web = new WebClient(slackToken)
const slackChannel = '#testing-purpose'

const reportPath = '../cypress/report/final-report'
const reportFile = ['output.json', 'index.html']

const cibuild = 'http://localhost:8888'

run().catch((err) => console.log(err))

async function run() {
  const url = 'https://slack.com/api/chat.postMessage'
  const urlFileUpload = 'https://slack.com/api/files.upload'

  const file = fs.readFileSync('../cypress/report/final-report/output.json')    
  let reportJson = JSON.parse(file)
  let reportStats = reportJson.stats
  let testSuites = reportStats.suites
  let testCases = reportStats.tests
  let testPassed = reportStats.passes
  let testFailed = reportStats.failures
  let testSkipped = reportStats.skipped
  let passedRate = reportStats.passPercent.toFixed(2)

//   let { CI_BUILD_URL, CI_BUILD_NUM, CI_PULL_REQUEST, CI_PROJECT_REPONAME, CI_PROJECT_USERNAME, JOB_NAME, CIRCLE_PROJECT_ID, } = process.env

//   if (typeof process.env.GIT_URL === 'undefined') {
//     throw new Error('GIT_URL not defined!')
//   }

//   const urlParts = process.env.GIT_URL.replace('https://github.com/', '').replace('.git', '')
//   const arr = urlParts.split('/');

//   (CI_SHA1 = process.env.GIT_COMMIT),
//   (CI_BRANCH = process.env.BRANCH_NAME),
//   (CI_USERNAME = process.env.CHANGE_AUTHOR),
//   (CI_BUILD_URL = process.env.BUILD_URL),
//   (CI_BUILD_NUM = process.env.BUILD_ID),
//   (CI_PULL_REQUEST = process.env.CHANGE_ID),
//   (CI_PROJECT_REPONAME = arr[1]),
//   (CI_PROJECT_USERNAME = arr[0])

  let blocksMsg = [
    {
      'type': 'header',
      'text': {
        'type': 'plain_text',
        'text': 'Cypress Integration Test',
        'emoji': true,
      },
    },
    {
      'type': 'section',
      'fields': [
        {
          'type': 'mrkdwn',
          'text': `*Test Suites*: ${testSuites} test suite(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `:white_check_mark: *Passed*: ${testPassed} test case(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `*Test Cases*: ${testCases} test case(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `:x: *Failed*: ${testFailed} test case(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `*Passing rate*: ${passedRate}%`,
        },
        {
          'type': 'mrkdwn',
          'text': `:no_entry: *Skipped*: ${testSkipped} test case(s)`,
        },
      ],
    },
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `<${cibuild}|Build Logs>`,
      },
    },
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `<${process.env.BUILD_URL}|HTML Report>`,
      },
    },
  ]

  const res = await axios.post(url, {
    channel: '#testing-purpose',
    blocks: blocksMsg,
  }, {
    headers: { authorization: `Bearer ${slackToken}` },
  })

  console.log('Done', res.data)

  //   const fileRes = await axios.post(urlFileUpload, {
  //     channel: '#testing-purpose',
  //     fileName: 'Cypress HTML',
  //     file: fs.createReadStream('../cypress/report/final-report/output.json'),
  //   }, {
  //     headers: { authorization: `Bearer ${slackToken}`},
  //   })


  //   const uploadFiletoSlack = (fileNames) => {
  //     fileNames.forEach(async (file) => {
  //       console.log(`${reportPath}/${file}`)
  //       let res = await web.files.upload({
  //         files: fs.createReadStream(`${reportPath}/${file}`),
  //         channels: slackChannel,
  //       })
  //       console.log(res)
  //     });
  //   }

//   uploadFiletoSlack(reportFile)
}


( () => {
  reportFile.forEach(async (file) => {
    const result = await web.files.upload({
      file: fs.createReadStream(`${reportPath}/${file}`),
      channels: '#testing-purpose',
    })

    console.log('File uploaded: ', result.file.id)
  })
})()
