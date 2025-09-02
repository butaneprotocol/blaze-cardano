rm -rf pkg pkg-node pkg-web pkg-bundler
wasm-pack build --release --target nodejs
mv pkg ../dist/wasm/pkg-node

wasm-pack build --release --target web
jq '.name = "uplc-web"' pkg/package.json > pkgtemp.json && mv pkgtemp.json pkg/package.json
mv pkg ../dist/wasm/pkg-web

wasm-pack build --release --target bundler
jq '.name = "uplc-bundler"' pkg/package.json > pkgtemp.json && mv pkgtemp.json pkg/package.json
mv pkg ../dist/wasm/pkg-bundler