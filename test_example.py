from browser_use import Agent, Browser, BrowserConfig
import asyncio
from dotenv import load_dotenv
import os
import signal
import sys
import subprocess
import json
import time
import argparse
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage, AIMessage
from typing import Any, List, Optional, Dict
from pydantic import Field, ConfigDict
from langchain_anthropic import ChatAnthropic

# Carrega as variáveis de ambiente
load_dotenv()

# Handler para SIGINT (Ctrl+C)
def signal_handler(sig, frame):
    print("\nEncerrando graciosamente...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

class CursorLLM(BaseChatModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
            
    @property
    def _llm_type(self) -> str:
        return "cursor"
        
    def run_applescript(self, script: str) -> bool:
        try:
            subprocess.run(['osascript', '-e', script], check=True)
            return True
        except subprocess.CalledProcessError:
            return False
            
    def send_command_to_cursor(self, command: str) -> bool:
        # Primeiro ativa o Cursor
        activate_script = """
tell application "Cursor"
  activate
end tell

tell application "System Events"
  tell process "Cursor"
    set frontmost to true
    delay 0.1
    keystroke "/" using command down
    delay 0.1
  end tell
end tell
"""
        if not self.run_applescript(activate_script):
            return False
            
        # Pequeno delay para garantir que o Cursor está pronto
        time.sleep(0.3)
        
        # Envia o comando
        escaped_command = str(command).replace('"', '\\"')
        send_command_script = f"""
tell application "System Events"
  tell process "Cursor"
    delay 0.1
    keystroke "{escaped_command}"
    delay 0.1
    key code 36 -- Enter key
  end tell
end tell
"""
        return self.run_applescript(send_command_script)

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> AIMessage:
        last_message = messages[-1].content if messages else ""
        if isinstance(last_message, list):
            last_message = " ".join(str(item) for item in last_message)
            
        try:
            # Envia o comando via AppleScript
            success = self.send_command_to_cursor(last_message)
            
            # Cria uma resposta no formato esperado pelo Agent
            content = "Comando enviado com sucesso" if success else "Erro ao enviar comando"
            return AIMessage(
                content=content,
                additional_kwargs={
                    "generations": [{
                        "text": content,
                        "generation_info": {}
                    }]
                }
            )
            
        except Exception as e:
            print(f"Erro ao chamar o Cursor LLM: {str(e)}")
            return AIMessage(
                content=str(e),
                additional_kwargs={
                    "generations": [{
                        "text": str(e),
                        "generation_info": {}
                    }]
                }
            )

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> AIMessage:
        return self._generate(messages, stop, run_manager, **kwargs)

    def with_structured_output(self, output_schema: Any, **kwargs: Any) -> BaseChatModel:
        return self

def get_llm(model_type: str) -> BaseChatModel:
    """
    Retorna o modelo LLM apropriado baseado no tipo especificado
    """
    if model_type.lower() == "anthropic":
        # Verifica se a chave API da Anthropic está configurada
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise ValueError("ANTHROPIC_API_KEY não está configurada no arquivo .env")
            
        return ChatAnthropic(
            model_name="claude-3-5-sonnet-20240620",
            temperature=0.0,
            timeout=25,
            stop=None
        )
    elif model_type.lower() == "cursor":
        return CursorLLM()
    else:
        raise ValueError(f"Modelo não suportado: {model_type}")

def parse_arguments():
    """Parse os argumentos da linha de comando"""
    parser = argparse.ArgumentParser(description="Automatização de navegador com diferentes modelos LLM")
    parser.add_argument(
        "--model",
        type=str,
        choices=["anthropic", "cursor"],
        default="cursor",
        help="Modelo LLM a ser usado (default: cursor)"
    )
    parser.add_argument(
        "--task",
        type=str,
        default="Vá ao Google apenas, pesquise por 'phiz chat' e retorne o primeiro resultado",
        help="Tarefa a ser executada pelo agente"
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Executar o navegador em modo headless (sem interface gráfica)"
    )
    return parser.parse_args()

async def main():
    args = parse_arguments()
    agent = None
    
    try:
        # Configura o browser
        browser = Browser(
            config=BrowserConfig(
                headless=args.headless,
                disable_security=True
            )
        )
        
        # Obtém o modelo LLM apropriado
        try:
            llm = get_llm(args.model)
        except ValueError as e:
            print(f"Erro ao configurar o modelo: {str(e)}")
            return
        
        # Cria o agente com a tarefa especificada
        agent = Agent(
            task=args.task,
            llm=llm,
            browser=browser
        )
        
        # Executa a tarefa
        print(f"\nUsando modelo: {args.model}")
        print(f"Tarefa: {args.task}")
        print("\nIniciando a tarefa...")
        
        result = await agent.run()
        print("\nResultado:", result)
    
    except KeyboardInterrupt:
        print("\nOperação cancelada pelo usuário.")
    except Exception as e:
        print(f"\nErro durante a execução: {str(e)}")
    finally:
        if agent:
            try:
                await agent.browser.close()
            except:
                pass

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nPrograma encerrado pelo usuário.") 