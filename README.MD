# Local Chatbot

Simple web application that allows users to communicate with an LLM hosted locally. This is a very bare-bones example of an AI Chat Bot Assistant application, consisting of a simple frontend interface (in vanilla JS) where the users can input messages and send them to a backend API endpoint. The backend then prompts an LLM and streams the responses back to the frontend. The application uses a Llama 3 model running in a Docker container, hosted locally.

# Installation
#### Clone the repository
```bash
git clone https://github.com/davidmrc6/local-chatbot.git
```
#### Navigate to project directory and download dependencies
```bash
cd local-chatbot
npm i
```
#### Set up Docker container and download Llama 3 model
##### Create `.llms` directory to store the models pulled from Ollama library
```bash
mkdir .llms
```
##### Build image
```bash
docker build -t ollama .
```
You might need to run this as an administrator.
##### Run container
```bash
docker run -it -p 11434:11434 -v /Projects/local-chatbot/.llms/:/root/.ollama ollama
```
Here, I use the example directory `/Projects/local-chatbot/` on the host and mount it to `/root/.ollama` inside the container. Make sure to adjust the host directory location to match your setup. (Note: you can get your current working directory by running `pwd`).
##### Download the LLM
To download the desired model from the Ollama library, use the following `curl` command (while the Docker container is still running):
```bash
curl http://localhost:11434/api/pull -d '{
  "name": "llama3"
}'
```
Pulling the LLM model might take a few minutes.
If the LLM has been pulled succesfully, you will see a `{"status":"success"}` message on your terminal.
# Usage
Once you've downloaded the model for the first time, you don't need to download it against subsequently. In case your Docker container isn't running, run it again:
#### Run container
```bash
docker run -it -p 11434:11434 -v /Projects/local-chatbot/.llms/:/root/.ollama ollama
```
Here, I use the example directory `/Projects/local-chatbot/` on the host and mount it to `/root/.ollama` inside the container. Make sure to adjust the host directory location to match your setup. (Note: you can get your current working directory by running `pwd`).


Optionally, before running the server, you can change the initial prompt and the maximum message history variables inside the `server.js` file:
```javascript
const MAX_HISTORY = 12;
const SYSTEM_PROMPT = "You are a helpful AI Assistant."; // Introduce initial prompt here
```

Once the container is up and running, run the server using `npm`:
#### Run server
```bash
npm start
```
Once the server is running, you can open the `src/public/index.html` file in your browser and start chatting!
Note that, after the first message to the server, the response will take longer than anticipated. All subsequent messages should arrive as expected.
# Notes from the developer
The project is still in a pretty early stage, and I will be maintaing and upgrading. There are a few issues I am currently working on, such as the llama runner not being started on start of the server but rather when the user sends his first message (which leads to an awkward silence between the initial message and the initial Llama response). The current history feature implementation also makes message generation a bit slower than I would like it to be.

# Further development
This simple interface allows for freedom in developing further, more complex, features. There are other endpoints initialized (but never used) for clearing conversation history and getting the conversation history of a session with a `sessionId`. When the user sends a request to the backend server, the request body also contains a `sessionId` field, which is initialized to a default value of `'1'`. This could be used to save message history and allow the user to switch between different converesations.
