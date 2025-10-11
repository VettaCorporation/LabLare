// generate_hash.js
    const bcrypt = require('bcrypt');
    const plainTextPassword = 'rejane'; // Altere esta senha para a que você deseja hashear

    async function generateAndPrintHash() {
        const saltRounds = 10;
        try {
            const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
            console.log('----------------------------------------------------');
            console.log('Senha Original:', plainTextPassword);
            console.log('HASH GERADO (COPIE ESTE VALOR):');
            console.log(hashedPassword);
            console.log('----------------------------------------------------');
        } catch (error) {
            console.error('Erro ao gerar o hash:', error);
        }
    }

    generateAndPrintHash();


    // para utilizar é so abrir no terminal e colocar "node generate_hash.js" e onde tem no código DIGITE SENHA , é so escolher a sua
