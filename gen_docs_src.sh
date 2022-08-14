#!/bin/bash

rm -rf ./docs/src
mkdir -p ./docs/src/{modules,keys}
cp ./demo-backend/demo-backend-cli.js ./docs/src/
cp ./demo-client/demo-client-cli.js ./docs/src/
cp ./demo-client/demo-client-cli-ws.js ./docs/src/

cp ./demo-backend/demo-backend_lib.js ./docs/src/modules/
cp ./demo-client/demo-client.js ./docs/src/modules/
cp ./demo-client/demo-client-ws.js ./docs/src/modules/

echo "Getting server's public key..."

#curl -s http://api.platform.safechats.com/api/v3/publicKey | node -e "process.stdin.on('data', function(data){ console.log( JSON.stringify(JSON.parse(data).publicKey) ); });" > ./docs/src/keys/ServerPublicKey.json

echo "Received. Processing source files..."

echo "
// API
exports.serverURL = \"api.platform.safechats.com\"; // no trailing slash
exports.APIURL = \"http://\" + exports.serverURL; // no trailing slash
exports.APIPath = \"/api/v3\"; // no trailing slash
exports.wsProto = \"ws://\";

exports.BackendPath = \"/backend\";	// no trailing slash
exports.PublicPath = \"/public\";		// no trailing slash

// Demo backend
exports.demoBackendPath = \"/server/v1\"; // no trailing slash

// Signing
exports.signAlgorithm = \"RSA-SHA256\";
exports.clientKeyDirectory = \"./keys\";
" > ./docs/src/config.js

sed -e 's/\.\.\/config\.js/.\/config.js/g' -i "" ./docs/src/demo-backend-cli.js
sed -e 's/\.\/demo-backend_lib.js/.\/modules\/demo-backend_lib.js/g' -i "" ./docs/src/demo-backend-cli.js
sed -e 's/\.\/demo-client.js/.\/modules\/demo-client.js/g' -i "" ./docs/src/demo-client-cli.js
sed -e 's/\.\/demo-client-ws.js/.\/modules\/demo-client-ws.js/g' -i "" ./docs/src/demo-client-cli-ws.js

tar zcvf ./docs/src.tar.gz ./docs/src/config.js ./docs/src/demo-client-cli.js ./docs/src/demo-client-cli-ws.js ./docs/src/keys/ServerPublicKey.json ./docs/src/modules/demo-client.js ./docs/src/modules/demo-client-ws.js ./docs/src/demo-backend-cli.js ./docs/src/modules/demo-backend_lib.js
# tar zcvf ./docs/src.tar.gz ./docs/src/config.js ./docs/src/demo-backend-cli.js ./docs/src/demo-client-cli.js ./docs/src/demo-client-cli-ws.js ./docs/src/keys/ServerPublicKey.json ./docs/src/modules/demo-backend_lib.js ./docs/src/modules/demo-client.js ./docs/src/modules-demo-client-ws.js


echo "docs/src.tar.gz created"

echo "Done"
