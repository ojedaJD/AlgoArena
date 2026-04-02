FROM gcc:13-bookworm

# Install only what's needed, then clean up
RUN apt-get update && \
    apt-get install -y --no-install-recommends g++ && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    useradd -m -u 1000 -s /bin/sh sandbox

USER sandbox
WORKDIR /sandbox
