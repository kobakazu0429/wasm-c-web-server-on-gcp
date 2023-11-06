# wasm-c-web-server-on-gcp

## Setup

```bash
bash bootstrap.sh
```

- Add DNS record
  - https://domains.google.com/registrar/kaz.dev/dns
    - `compiler.kaz.dev` : `CNAME` : `ghs.googlehosted.com`
    - `lsp.kaz.dev` : `CNAME` : `ghs.googlehosted.com`
- Add User to Google Search Console for Verification
  - https://search.google.com/search-console/users?resource_id=sc-domain%3Akaz.dev
  - $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com
