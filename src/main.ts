import * as core from '@actions/core'
import * as github from '@actions/github'
import {wait} from './wait'
import { getOwnership, computeReviewers, Team } from './ownership';
import fs from 'fs'

async function run(): Promise<void> {
  try {
    const token = core.getInput('github_token') || process.env.GITHUB_TOKEN

    if (!token) {
      core.setFailed('❌ Missing Github token')
      return
    }

    const codeownersFilepath = core.getInput('codeowners_file_path')

    if (!codeownersFilepath) {
      core.setFailed('❌ Missing codeowners filepath')
      return
    }

    const ownershipJsonFilePath = core.getInput('ownership_json_file_path')

    if (!ownershipJsonFilePath) {
      core.setFailed('❌ Missing ownership JSON')
      return
    }

    const pullRequest = github.context.payload.pull_request

    if (pullRequest) {
      const octokit = github.getOctokit(token)

      const {
        repo: {repo: repoName, owner: repoOwner},
        runId: runId
      } = github.context
      const defaultParameter = {
        repo: repoName,
        owner: repoOwner
      }
      const files = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
        ...defaultParameter,
        pull_number: pullRequest.number
      })

      const filepaths = files.data.map((item) => {
        return item.filename
      });

      const owners = await getOwnership(codeownersFilepath, filepaths);
      const ownershipJson = JSON.parse(fs.readFileSync(ownershipJsonFilePath, 'utf-8')) as Team[]
      const currentReviewersResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
        owner: 'OWNER',
        repo: 'REPO',
        pull_number: pullRequest.number
      })
      const currentReviewersUsers = currentReviewersResponse.data.users.map((user) => user.login);
      const reviewersToAdd = await computeReviewers(ownershipJson, owners, currentReviewersUsers)
      
      core.info('final owners: ' + JSON.stringify(reviewersToAdd))
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed("Caught an error: " + error.message)
  }
}

run()
