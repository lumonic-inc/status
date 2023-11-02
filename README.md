## Reporting your first incident
1. Go to issues tab 
2. Create a new label `incident`
3. Create a issue
4. Add the label `incident` to the issue

# Deploys
Run workflow at https://github.com/lumonic-inc/status/actions/workflows/pages.yml 


# How it works

- Hosting
    - GitHub Pages is used for hosting the status page.

- Monitoring
    - Github Workflow will be triggered every 1 Hr (Configurable) to visit the website.
    - Response status and response time is commited to github repository.

- Incidents
    - Github issue is used for incident management.


## Change monitoring interval
If you want to change the time interval of monitoring then you can change it in `.github > workflows > health-check.yml` file.
update the cron time in the following line.

```yaml
    on:
      schedule:
        - cron: "0 0/12 * * *"
```

# Forked from Fettle 💟 

**Fettle** is the open-source status page, powered entirely by GitHub Actions, Issues, and Pages.
