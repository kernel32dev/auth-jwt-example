# auth-jwt-example

Projeto "clean-code" de amigo oculto

- *Germano Barbosa da Silva Júnior*
- *Daniel Luca Dos Santos Silva*

### Modelagem

Existem usuários (`User`) e grupos (`Group`) que são onde os usuários se encontram para fazer o sorteio, a relação entre essas tabelas é a tabela `Member`, quando um grupo tem mais de 3 membros, o dono da sala pode fazer o sorteio e cada usuário poderá ver qual presente ganhou, depois disso a sala é congelada para que nada possa alterar ela

### Arquitetura

O projeto é divido em autenticação, e as apis da logicas de negócios

As duas são dividas em 4 camadas

- **routes** definem o caminho e verbo para os controllers
- **controller** tratam da serialização, deserialização e autenticação
- **service** onde se encontra a regra de negócio e autorização
- **repository** onde o banco é lido e modificado

### Inversão de Dependências

Todas as funções das 4 camadas recebem em seus argumentos as suas dependências

Por causa do princípio da segregação de interface, cada interface só tem uma funcionalidade, as interfaces são implementadas por funções que implementam apenas uma interface

### Tratamento de erros

Foi usado um wrapper que é chamado para tratar erros assíncronos `catchApiExceptions`

O `express-async-error` era um hack então achei melhor tratar isso com o wrapper

### Injeção de Dependências

Foi feita manualmente, sem imitar o Java

Funções auxiliares para injetar as dependências com valores padrões são dados, para deixar o código mais enxuto

### Revisão SOLID

Os princípios SOLID foram aplicados:

- *Single Responsibility Principle (SRP)*: Cada classe e função tem uma única responsabilidade

- *Open/Closed Principle (OCP)*: O sistema é projetado para ser extensível sem modificar o código existente. Novas funcionalidades podem ser adicionadas através da implementação de novos serviços ou repositórios

- *Liskov Substitution Principle (LSP)*: As interfaces são usadas para garantir que as implementações possam ser substituídas sem afetar o comportamento do sistema

- *Interface Segregation Principle (ISP)*: Interfaces específicas são definidas para cada serviço e repositório, simplificando a implementação

- *Dependency Inversion Principle (DIP)*: As dependências são injetadas nas funções, permitindo maior flexibilidade e testabilidade