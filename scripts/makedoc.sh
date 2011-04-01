#!/bin/sh
node $(dirname $0)/umecob-command.js docs/README.tpl.md docs/en.lang > $(dirname $0)/../docs/README.md
node $(dirname $0)/umecob-command.js docs/README.tpl.md docs/ja.lang > $(dirname $0)/../docs/README.ja.md
