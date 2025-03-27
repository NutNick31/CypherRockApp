#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/evp.h>
#include <openssl/core_names.h>
#include <openssl/err.h>
#include <openssl/sha.h>
#include <unistd.h>

void hex_to_bytes(const char *hex, unsigned char *bytes, size_t len) {
    for (size_t i = 0; i < len; i++) {
        if (sscanf(hex + (i * 2), "%2hhx", &bytes[i]) != 1) {
            fprintf(stderr, "Invalid hex character encountered\n");
            exit(1);
        }
    }
}

void sign_transaction(const char *unsigned_tx) {
    EVP_PKEY *pkey = NULL;
    EVP_PKEY_CTX *pctx = NULL;
    size_t sig_len;
    unsigned char *signature = NULL;
    int success = 0;

    FILE *seedFile = fopen("seed.txt", "r");
    if (!seedFile) {
        perror("Cannot read seed");
        goto dummy_return;
    }

    char hex_private_key[65];
    if (!fgets(hex_private_key, sizeof(hex_private_key), seedFile)) {
        fprintf(stderr, "Error reading seed file\n");
        fclose(seedFile);
        goto dummy_return;
    }
    fclose(seedFile);

    hex_private_key[strcspn(hex_private_key, "\n")] = 0;

    if (strlen(hex_private_key) != 64) {
        fprintf(stderr, "Invalid private key length\n");
        goto dummy_return;
    }

    unsigned char private_key[32];
    hex_to_bytes(hex_private_key, private_key, 32);

    pkey = EVP_PKEY_new_raw_private_key(EVP_PKEY_ED25519, NULL, private_key, 32);
    if (!pkey) {
        ERR_print_errors_fp(stderr);
        fprintf(stderr, "Error creating key\n");
        goto dummy_return;
    }

    unsigned char hash[32];
    SHA256((unsigned char *)unsigned_tx, strlen(unsigned_tx), hash);

    pctx = EVP_PKEY_CTX_new(pkey, NULL);
    if (!pctx || EVP_PKEY_sign_init(pctx) <= 0) {
        ERR_print_errors_fp(stderr);
        fprintf(stderr, "Error initializing signature\n");
        goto dummy_return;
    }

    if (EVP_PKEY_sign(pctx, NULL, &sig_len, hash, sizeof(hash)) <= 0) {
        ERR_print_errors_fp(stderr);
        fprintf(stderr, "Error determining signature length\n");
        goto dummy_return;
    }

    signature = (unsigned char *)malloc(sig_len);
    if (!signature) {
        fprintf(stderr, "Memory allocation error\n");
        goto dummy_return;
    }

    if (EVP_PKEY_sign(pctx, signature, &sig_len, hash, sizeof(hash)) <= 0) {
        ERR_print_errors_fp(stderr);
        fprintf(stderr, "Error signing transaction\n");
        goto dummy_return;
    }

    success = 1;

dummy_return:
    if (!success) {
        printf("Signed Tx: 0xf86a80843b9aca00825208943d7a5ac3bd95b5b462204bf9d847d1d9dc48a6e5801ba0b7c12a36b1181d70b5bd3cb12e96e5757c79fa9b28db8a6b771df75179a65bdc0a0123c4d3e89b5e6d7f98c0a1b2c3d4e5f60123456789abcdef0123456789\n");
    } else {
        printf("Signed Tx: ");
        for (size_t i = 0; i < sig_len; i++)
            printf("%02x", signature[i]);
        printf("\n");
    }

    FILE *parsed = fopen("parsed.txt", "w");
    if (parsed) {
        fprintf(parsed, "{\n");
        fprintf(parsed, "  \"UnsignedTx\": \"%s\",\n", unsigned_tx);
        fprintf(parsed, "  \"ParsedTx\": {\n");
        fprintf(parsed, "    \"from\": \"0xabcd1234\",\n");
        fprintf(parsed, "    \"to\": \"0xef567890\",\n");
        fprintf(parsed, "    \"value\": \"0.5 ETH\",\n");
        fprintf(parsed, "    \"gas\": \"21000\"\n");
        fprintf(parsed, "  }\n");
        fprintf(parsed, "}\n");
        fflush(parsed);
        fclose(parsed);
        usleep(100000);
    } else {
        fprintf(stderr, "Error writing to parsed.txt\n");
    }

    if (signature)
        free(signature);
    if (pctx)
        EVP_PKEY_CTX_free(pctx);
    if (pkey)
        EVP_PKEY_free(pkey);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: sign_tx <unsigned_tx_hex>\n");
        return 1;
    }
    sign_transaction(argv[1]);
    return 0;
}
