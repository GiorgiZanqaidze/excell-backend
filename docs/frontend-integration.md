## Frontend Guide (Conversational) — excell-backend

_Version: 1.0_

This is a practical, conversational FAQ for frontend teams integrating with the backend.

### What’s the base URL? Do I need CORS?

- Base URL: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api`
- Ensure your app origin is in `CORS_ORIGINS` (.env). Example: `CORS_ORIGINS=http://localhost:4200`

### What can I do with the API?

- List templates: `GET /file/templates`
- Template details: `GET /file/templates/:templateName`
- Download template: `GET /file/templates/:templateName/download?includeSample=true|false` → XLSX
- Upload Excel (sync): `POST /file/upload/:templateName` (multipart field `file`)
- Upload Excel (async): `POST /file/upload/:templateName/async` → `{ jobId }`
- Check job: `GET /file/jobs/:id`
- Export data to Excel: `GET /file/export/:templateName?limit=` → XLSX
- Fetch paginated data: `GET /file/data/:templateName?page=&limit=`

### Which templates exist out of the box?

- `users` and `products` (see README for columns). You can inspect schema via `GET /file/templates/:templateName`.

### How do I integrate in Angular quickly?

```ts
// excel-backend.service.ts
@Injectable({ providedIn: 'root' })
export class ExcelBackendService {
  private readonly base = 'http://localhost:3000';
  constructor(private http: HttpClient) {}

  getTemplates() {
    return this.http.get<ExcelTemplate[]>(`${this.base}/file/templates`);
  }

  getTemplateInfo(name: string) {
    return this.http.get<ExcelTemplate>(`${this.base}/file/templates/${name}`);
  }

  downloadTemplate(name: string, includeSample = false) {
    const params = new HttpParams().set('includeSample', String(includeSample));
    return this.http.get(`${this.base}/file/templates/${name}/download`, {
      params,
      responseType: 'blob',
    });
  }

  uploadSync(name: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{
      message: string;
      processed: number;
      errors: string[];
    }>(`${this.base}/file/upload/${name}`, form);
  }

  uploadAsync(name: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ jobId: string }>(
      `${this.base}/file/upload/${name}/async`,
      form,
    );
  }

  getJobStatus(id: string) {
    return this.http.get<{
      id: string;
      state: string;
      progress: number;
      attemptsMade: number;
      returnvalue: unknown;
      failedReason?: string;
    }>(`${this.base}/file/jobs/${id}`);
  }

  exportData(name: string, limit = 1000) {
    const params = new HttpParams().set('limit', limit);
    return this.http.get(`${this.base}/file/export/${name}`, {
      params,
      responseType: 'blob',
    });
  }

  getData<T = any>(name: string, page = 1, limit = 10) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<T[]>(`${this.base}/file/data/${name}`, { params });
  }
}
```

### How do I save downloads (templates/exports) in the browser?

```ts
this.service.downloadTemplate('users', true).subscribe((blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users_template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
});
```

### How do I poll an async job until it’s done?

```ts
this.service.uploadAsync('users', file).subscribe(({ jobId }) => {
  const sub = interval(1500)
    .pipe(switchMap(() => this.service.getJobStatus(jobId)))
    .subscribe((s: any) => {
      if (['completed', 'failed'].includes(s.state)) {
        sub.unsubscribe();
        // handle s.returnvalue or s.failedReason
      }
    });
});
```

### What does a sync upload response look like?

```json
{
  "message": "Processed 10 of 12 rows",
  "processed": 10,
  "errors": ["Row 3: Field 'email' is required"]
}
```

### Common pitfalls

- Use multipart field name `file` (case-sensitive).
- For downloads, set `responseType: 'blob'`.
- Dates should be `YYYY-MM-DD`. Booleans: `true/false`. Numbers: decimal point.
- If you get CORS errors, update `CORS_ORIGINS` in backend `.env` and restart.

### Can I change the base URL per environment?

Yes. Put it in your frontend environment file (e.g., Angular `environment.ts`) and inject it into the service.

### Where can I explore available columns and examples?

Open Swagger at `http://localhost:3000/api` and hit `GET /file/templates` or `GET /file/templates/{templateName}`.

---

If anything is unclear, open an issue or extend this doc with more Q&A.
