const bcrypt = require('bcryptjs'); // MUDANÇA AQUI
const { program } = require('commander');

program
    .option('-p, --password <type>', 'Password to hash')
    .parse(process.argv);

const options = program.opts();

if (!options.password) {
    console.error('Password is required. Use -p or --password option.');
    process.exit(1);
}

const saltRounds = 10;
bcrypt.hash(options.password, saltRounds, function (err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed Password:', hash);
});

// Quando quiser uma outra nova senha, entrar na pasta -> cd gerador_de_hash    e dpsrodar -> node generate_hash.js -p SUA_SENHA_AQUI