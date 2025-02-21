# Browser Use - Automação com Python e LLMs

Este projeto demonstra a automação de navegador usando Python, Playwright e diferentes modelos de LLM (Language Learning Models).

## Ambiente de Desenvolvimento

### Requisitos do Sistema
- Python 3.9+
- pip3
- Navegador Chromium (instalado automaticamente pelo Playwright)

### Configuração do Ambiente Virtual
Para evitar conflitos e garantir um ambiente isolado, siga estes passos:

1. Criar um novo ambiente virtual:
```bash
python -m venv .venv_new
source .venv_new/bin/activate
```

2. Instalar as dependências necessárias:
```bash
pip3 install python-dotenv langchain-anthropic playwright
playwright install chromium
```

### Dependências Principais
- python-dotenv: Para gerenciamento de variáveis de ambiente
- langchain-anthropic: Para integração com o modelo Claude da Anthropic
- playwright: Para automação do navegador

## Aprendizados Importantes

1. **Ambiente Virtual**: 
   - É crucial usar um ambiente virtual Python limpo para evitar conflitos de dependências
   - O uso do `.venv_new` ajudou a resolver problemas de importação de módulos

2. **Instalação de Dependências**:
   - Usar `pip3` em vez de `pip` pode resolver problemas de versão do Python
   - Instalar as dependências uma a uma pode ajudar a identificar problemas específicos

3. **Playwright**:
   - Após instalar o pacote, é necessário instalar o navegador com `playwright install chromium`
   - O modo headless pode ser controlado no lançamento do navegador

4. **Variáveis de Ambiente**:
   - O arquivo `.env` deve estar na raiz do projeto
   - Necessário para armazenar chaves de API de forma segura (ex: ANTHROPIC_API_KEY)

## Estrutura do Projeto
- `test_example.py`: Implementação principal com suporte a múltiplos LLMs
- `anthropic_test.py`: Versão simplificada usando apenas o modelo Anthropic
- `.env`: Arquivo para variáveis de ambiente (não versionado)

## Solução de Problemas

1. **ModuleNotFoundError: No module named 'dotenv'**
   - Solução: Instalar python-dotenv usando pip3
   ```bash
   pip3 install python-dotenv
   ```

2. **Problemas com Importações**
   - Solução: Usar um ambiente virtual novo e limpo
   - Garantir que todas as dependências estão instaladas corretamente

3. **Navegador não Encontrado**
   - Solução: Instalar o Chromium via Playwright
   ```bash
   playwright install chromium
   ```
