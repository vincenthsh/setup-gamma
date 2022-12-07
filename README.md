# setup-gamma

Setup your GitHub actions workflow with a specific version of Gamma

## How to use with GitHub Actions

You will need to [create a Github Application](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app) for Gamma to use. This should have write access to all the repos that you are deploying to.

You'll need to install your application in the organisation, and grab the installation number.

Gamma requires the following environment variables. You should set these as secrets in the repo, and pass them through in the workflow configuration.

**NOTE:** You can't prefix secrets with `GITHUB_` - you can use something like `GH_` instead.

`GITHUB_APP_INSTALLATION_ID`

Once you've installed the app to your organisation, you can find this in the URL

It'll look something like https://github.com/organizations/mono-actions/settings/installations/31502012

You'll want to take `31502012` from the URL.

`GITHUB_APP_ID`

This is the "App ID" in the Github Application's settings.

`GITHUB_APP_PRIVATE_KEY`

When you create your application, you'll be prompted to create a private key. Copy the contents into the secret field.

### Deployment

Once your Github application has been created and the secrets have been set in your monorepo, you can use Gamma in your workflow.

Here's an example configuration for deploying the actions on a commit into `main`.

`.github/workflows/deploy.yml`

```yaml
name: Deploy actions

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Make sure you set this, as Gamma needs the Git history

      - uses: actions/setup-node@v3
        
      - uses: gravitational/setup-gamma@v1

      - run: yarn # Install your dependencies as normal

      - run: yarn test # Test your actions, if you have tests

      - name: Deploy actions
        run: gamma deploy
        env:
          GITHUB_APP_INSTALLATION_ID: ${{ secrets.GH_APP_INSTALLATION_ID }}
          GITHUB_APP_ID: ${{ secrets.GH_APP_ID }}
          GITHUB_APP_PRIVATE_KEY: ${{ secrets.GH_APP_PRIVATE_KEY }}
```

Gamma will check what files have changed from HEAD and the previous commit. For this reason, you should only use squash & merge when merging pull requests.

Once it's detected the changed files, it'll check which actions have file changes and only build and deploy the changes needed.

Gamma mirrors the commit message - if you commit to the monorepo a message such as `"Update the README to add an example"`, it'll commit to the destination repository with the same commit message.

### Testing pull requests

It's also important to check that Gamma can build the action and compile the `action.yml` for pull requests. To do this, you can use the `gamma build` command instead.

`.github/workflows/build.yml`

```yaml
name: Build actions

on:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3

      - uses: gravitational/setup-gamma@v1

      - run: yarn # Install your dependencies as normal
        
      - run: yarn test # Test your actions, if you have tests

      - name: Build actions
        run: gamma build
```
