# Use Ollama Docker image
FROM ollama/ollama:latest

# Expose port 11434
EXPOSE 11434

# Run Ollama and serve
ENTRYPOINT ["/bin/ollama"]
CMD ["serve"]
