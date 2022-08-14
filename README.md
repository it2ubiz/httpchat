# SafeChats Communications Platform

## Setup
- (Local environment only) Copy config.dist.js to config.js and edit the AWS credentials and region
- Run "npm install". It will also create DynamoDB tables.

To recreate DynamoDB tables or to change read/write capacity edit configuration settings in createDynamoDBTables.js and run "npm install".

## How to use
- Launch "npm test" to run tests
- Launch "npm run-script docs" to generate the API specs (docs/API.html).
- Launch "npm run-script demo-backend-cli" to launch the demo backend API CLI
- Launch "npm run-script demo-client-cli" to launch the demo client CLI

**IMPORTANT:** Make sure to launch *demo-client-cli* first and save the server's public key to *demo-client/keys/ServerPublicKey.json* before running demo-scenario-test.

- Launch "npm run-script demo-scenario-test" to launch the demo scenario test

**IMPORTANT:** Make sure https://api.platform.safechats.com works before running *gen_docs_src.sh* as it requests the server's public key from the remote server.

- Execute *"./gen_docs_src.sh"* to create *docs/src* with the sample applications *demo-backend-cli* and *demo-client-cli*. Change your current directory to *docs/src* and run *"node demo-backend-cli"* or *"node demo-client-cli"*.
