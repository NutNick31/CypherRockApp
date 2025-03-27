#include <stdio.h>
#include <stdlib.h>
#include <openssl/evp.h>
#include <openssl/ec.h>
#include <openssl/err.h>

void handle_openssl_error() {
    ERR_print_errors_fp(stderr);
    exit(EXIT_FAILURE);
}

int main() {
    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_id(EVP_PKEY_EC, NULL);
    if (!ctx) handle_openssl_error();

    if (EVP_PKEY_keygen_init(ctx) <= 0) handle_openssl_error();
    if (EVP_PKEY_CTX_set_ec_paramgen_curve_nid(ctx, NID_secp256k1) <= 0) handle_openssl_error();

    EVP_PKEY *pkey = NULL;
    if (EVP_PKEY_keygen(ctx, &pkey) <= 0) handle_openssl_error();

    printf("EC Key successfully generated using OpenSSL 3.0 API\n");

    // Cleanup
    EVP_PKEY_free(pkey);
    EVP_PKEY_CTX_free(ctx);

    return 0;
}
