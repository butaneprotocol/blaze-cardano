rm -rf pkg ../dist/wasm ../dist/wasm/pkg-node ../dist/wasm/pkg-web ../dist/wasm/pkg-bundler
mkdir ../dist/wasm

wasm-pack build --target nodejs
jq '.name = "uplc-node"' pkg/package.json > pkgtemp.json && mv pkgtemp.json pkg/package.json
mv pkg ../dist/wasm/pkg-node

wasm-pack build --target web
jq '.name = "uplc-web"' pkg/package.json > pkgtemp.json && mv pkgtemp.json pkg/package.json
mv pkg ../dist/wasm/pkg-web

wasm-pack build --target bundler
jq '.name = "uplc-bundler"' pkg/package.json > pkgtemp.json && mv pkgtemp.json pkg/package.json
mv pkg ../dist/wasm/pkg-bundler