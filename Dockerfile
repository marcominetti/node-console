FROM ubuntu:15.04
MAINTAINER Marco Minetti <marco.minetti@novetica.org>

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt-get update
RUN apt-get -y dist-upgrade
RUN apt-get -y install gcc make curl git python python-dev libssl-dev build-essential ca-certificates

RUN apt-get clean
RUN rm /var/lib/apt/lists/* -rf

ENV NVM_DIR /usr/local/nvm
ENV PROFILE /etc/bash.bashrc
ENV NODE_VERSION 4.0.0

RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash \
    && source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION

RUN echo -e "#\!/bin/bash\nexport NVM_DIR=\"$NVM_DIR\"\n[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"\nnode \$@" > /usr/local/bin/node
RUN chmod +x /usr/local/bin/node

RUN echo -e "#\!/bin/bash\nexport NVM_DIR=\"$NVM_DIR\"\n[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"\nnpm \$@" > /usr/local/bin/npm
RUN chmod +x /usr/local/bin/npm

RUN /usr/local/bin/node -v
RUN /usr/local/bin/npm -v

RUN mkdir /app/
RUN cd /app/ && npm install node-console

EXPOSE 9090 9999

ENTRYPOINT exec /usr/local/bin/node /app/node_modules/node-console/run.console.js
