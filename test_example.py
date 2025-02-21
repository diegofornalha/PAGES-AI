from langchain_anthropic import ChatAnthropic
from browser_use import Agent
import asyncio
from dotenv import load_dotenv

# Carrega as variáveis de ambiente
load_dotenv()

async def main():
    # Cria um agente com uma tarefa específica
    agent = Agent(
        task="Vá ao Google, pesquise por 'Python Brasil' e retorne o primeiro resultado",
        llm=ChatAnthropic(model="claude-3-opus-20240229"),  # Usando Claude 3 Opus para melhor performance
    )
    
    # Executa a tarefa
    print("Iniciando a tarefa...")
    result = await agent.run()
    print("\nResultado:", result)

if __name__ == "__main__":
    # Executa o código assíncrono
    asyncio.run(main()) 