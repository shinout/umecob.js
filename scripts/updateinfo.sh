#!/bin/sh
thisdir=$(dirname $0)
node ${thisdir}/umecob-command.js docs/README.tpl.md docs/en.lang > ${thisdir}/../docs/README.md
node ${thisdir}/umecob-command.js docs/README.tpl.md docs/ja.lang > ${thisdir}/../docs/README.ja.md
node ${thisdir}/umecob-command.js scripts/package.tpl.json  > ${thisdir}/../package.json
