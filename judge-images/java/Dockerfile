FROM eclipse-temurin:17-jdk-jammy

# Clean up and create sandbox user
RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    useradd -m -u 1000 -s /bin/sh sandbox

USER sandbox
WORKDIR /sandbox
