#!/bin/sh
thisdir=$(dirname $0)
node ${thisdir}/umecob-command.js docs/README.tpl.md docs/en.lang > ${thisdir}/../README.md
node ${thisdir}/umecob-command.js docs/README.tpl.md docs/ja.lang > ${thisdir}/../README.ja.md
cp ${thisdir}/../README.md ${thisdir}/../docs/README.md
cp ${thisdir}/../README.ja.md ${thisdir}/../docs/README.ja.md
node ${thisdir}/umecob-command.js scripts/package.tpl.json  > ${thisdir}/../package.json
