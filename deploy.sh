#!/usr/bin/env bash
USER=lucas
HOST=lucasvandijk.nl
DIR=/var/www/lucasvandijk.nl/

hugo && rsync -avz --chown="www-data:www-data" --delete public/ ${USER}@${HOST}:${DIR}

exit 0
