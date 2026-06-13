async function main() {
  console.log('Worker starting — placeholder');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
