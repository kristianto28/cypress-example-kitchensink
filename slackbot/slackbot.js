const fs = require('fs')
const { WebClient } = require('@slack/web-api')
const config = require('./slackbot.config.json')

const slackToken = process.env.SLACK_TOKEN
const web = new WebClient(slackToken)

const sendReportSummary = async () => {
  let { numTestSuites, numTestCases, numTestPassed, numTestFailed, numTestSkipped, passedRate } = generateReportSummary()

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
          'text': `*Test Suites*: ${numTestSuites} test suite(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `:white_check_mark: *Passed*: ${numTestPassed} test case(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `*Test Cases*: ${numTestCases} test case(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `:x: *Failed*: ${numTestFailed} test case(s)`,
        },
        {
          'type': 'mrkdwn',
          'text': `*Passing rate*: ${passedRate}%`,
        },
        {
          'type': 'mrkdwn',
          'text': `:no_entry: *Skipped*: ${numTestSkipped} test case(s)`,
        },
      ],
    },
  ]

  //Check if the report is sent from Jenkins. If not, skip link to Build Logs and HTML Report download
  if (process.env.BUILD_URL) {
    blocksMsg[2] = {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `<${process.env.BUILD_URL}|Build Logs> \n <${config.jenkinsUrl}/job/CypressJenkins/HTML_20Report/*zip*/HTML_20Report.zip|Download report here>`,
      },
    }
  }

  const res = await web.chat.postMessage({
    channel: config.slackChannel,
    text: 'New Cypress integration report is here!',
    blocks: blocksMsg,
  })

  console.log('Done sending report summary', res)
}

const sendReportJson = async () => {
  const res = await web.files.upload({
    channels: config.slackChannel,
    file: fs.createReadStream(`${config.reportPath}/output.json`),
  })

  console.log('Done sending file', res.file.id)
}

const generateReportSummary = () => {
  const reportFile = fs.readFileSync(`${config.reportPath}/output.json`)
  let reportJson = JSON.parse(reportFile)
  let reportStats = reportJson.stats
  let numTestSuites = reportStats.suites
  let numTestCases = reportStats.tests
  let numTestPassed = reportStats.passes
  let numTestFailed = reportStats.failures
  let numTestSkipped = reportStats.pending
  let passedRate = reportStats.passPercent.toFixed(2)

  return {
    numTestSuites,
    numTestCases,
    numTestPassed,
    numTestFailed,
    numTestSkipped,
    passedRate,
  }
}

async function run () {
  sendReportSummary()
  sendReportJson()
}

run().catch((err) => console.log(err))
