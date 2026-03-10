import type { Component, ComponentDetailItem, ConnectionConfigVar, ConnectionInputField } from "./types"

export const COMPONENTS: Component[] = [
  // App Connectors
  {
    key: "salesforce",
    label: "Salesforce",
    description: "CRM platform for sales, service, and marketing",
    category: "app",
    iconColor: "#00A1E0",
    iconInitials: "SF",
    connectionType: "oauth2",
    capabilities: ["trigger", "step", "data_source"],
    version: "1.2.0",
    latestVersion: "1.4.0",
    connections: [
      { key: "oauth2", label: "Salesforce OAuth 2.0", type: "oauth2", isDefault: true },
      { key: "api-key", label: "Salesforce API Key", type: "api_key", isDefault: false },
      { key: "service-account", label: "Service Account", type: "basic", isDefault: false },
    ],
  },
  {
    key: "slack",
    label: "Slack",
    description: "Team messaging and collaboration platform",
    category: "app",
    iconColor: "#4A154B",
    iconInitials: "SL",
    connectionType: "oauth2",
    capabilities: ["trigger", "step"],
    version: "2.1.0",
    latestVersion: "2.3.1",
    connections: [
      { key: "oauth2", label: "Slack OAuth 2.0", type: "oauth2", isDefault: true },
      { key: "webhook", label: "Slack Webhook", type: "api_key", isDefault: false },
    ],
  },
  {
    key: "sftp",
    label: "SFTP",
    description: "Secure file transfer protocol operations",
    category: "app",
    iconColor: "#3B82F6",
    iconInitials: "FT",
    connectionType: "basic",
    capabilities: ["trigger", "step"],
    version: "3.0.1",
    latestVersion: "3.0.1",
    connections: [
      { key: "basic", label: "SFTP Connection", type: "basic", isDefault: true },
    ],
  },
  {
    key: "aws-s3",
    label: "AWS S3",
    description: "Amazon cloud object storage service",
    category: "app",
    iconColor: "#FF9900",
    iconInitials: "S3",
    connectionType: "api_key",
    capabilities: ["trigger", "step"],
    version: "2.0.0",
    latestVersion: "2.0.0",
    connections: [
      { key: "access-key", label: "AWS Access Key", type: "api_key", isDefault: true },
      { key: "role-arn", label: "IAM Role (ARN)", type: "basic", isDefault: false },
    ],
  },
  {
    key: "dropbox",
    label: "Dropbox",
    description: "Cloud file storage and synchronization",
    category: "app",
    iconColor: "#0061FF",
    iconInitials: "DB",
    connectionType: "oauth2",
    capabilities: ["trigger", "step"],
    version: "1.8.0",
    latestVersion: "2.0.0",
    connections: [
      { key: "oauth2", label: "Dropbox OAuth 2.0", type: "oauth2", isDefault: true },
    ],
  },
  {
    key: "google-sheets",
    label: "Google Sheets",
    description: "Cloud-based spreadsheet application",
    category: "app",
    iconColor: "#0F9D58",
    iconInitials: "GS",
    connectionType: "oauth2",
    capabilities: ["step", "data_source"],
    version: "4.1.0",
    latestVersion: "4.1.0",
    connections: [
      { key: "oauth2", label: "Google OAuth 2.0", type: "oauth2", isDefault: true },
      { key: "service-account", label: "Service Account (JSON)", type: "api_key", isDefault: false },
    ],
  },
  {
    key: "jira",
    label: "Jira",
    description: "Project tracking and issue management",
    category: "app",
    iconColor: "#0052CC",
    iconInitials: "JR",
    connectionType: "api_key",
    capabilities: ["trigger", "step", "data_source"],
    version: "1.5.2",
    latestVersion: "1.5.2",
    connections: [
      { key: "api-token", label: "Jira API Token", type: "api_key", isDefault: true },
      { key: "oauth2", label: "Jira OAuth 2.0", type: "oauth2", isDefault: false },
    ],
  },
  {
    key: "hubspot",
    label: "HubSpot",
    description: "CRM, marketing, and sales platform",
    category: "app",
    iconColor: "#FF7A59",
    iconInitials: "HS",
    connectionType: "oauth2",
    capabilities: ["trigger", "step", "data_source"],
    version: "3.2.0",
    latestVersion: "3.4.0",
    connections: [
      { key: "oauth2", label: "HubSpot OAuth 2.0", type: "oauth2", isDefault: true },
      { key: "api-key", label: "HubSpot API Key", type: "api_key", isDefault: false },
    ],
  },
  {
    key: "twilio",
    label: "Twilio",
    description: "Communication APIs for SMS and voice",
    category: "app",
    iconColor: "#F22F46",
    iconInitials: "TW",
    connectionType: "api_key",
    capabilities: ["step"],
    version: "1.0.0",
    latestVersion: "1.0.0",
    connections: [
      { key: "api-key", label: "Twilio API Key", type: "api_key", isDefault: true },
    ],
  },
  {
    key: "sendgrid",
    label: "SendGrid",
    description: "Email delivery and marketing service",
    category: "app",
    iconColor: "#1A82E2",
    iconInitials: "SG",
    connectionType: "api_key",
    capabilities: ["step"],
    version: "2.1.0",
    latestVersion: "2.1.0",
    connections: [
      { key: "api-key", label: "SendGrid API Key", type: "api_key", isDefault: true },
    ],
  },
  {
    key: "snowflake",
    label: "Snowflake",
    description: "Cloud data warehouse platform",
    category: "app",
    iconColor: "#29B5E8",
    iconInitials: "SN",
    connectionType: "basic",
    capabilities: ["step", "data_source"],
    version: "1.3.0",
    latestVersion: "1.3.0",
    connections: [
      { key: "basic", label: "Snowflake Connection", type: "basic", isDefault: true },
      { key: "key-pair", label: "Key Pair Auth", type: "api_key", isDefault: false },
    ],
  },
  {
    key: "postgresql",
    label: "PostgreSQL",
    description: "Relational database management system",
    category: "app",
    iconColor: "#4169E1",
    iconInitials: "PG",
    connectionType: "basic",
    capabilities: ["step", "data_source"],
    version: "2.0.0",
    latestVersion: "2.0.0",
    connections: [
      { key: "basic", label: "PostgreSQL Connection", type: "basic", isDefault: true },
    ],
  },
  {
    key: "http",
    label: "HTTP",
    description: "Make HTTP requests to any REST API",
    category: "app",
    iconColor: "#6366F1",
    iconInitials: "HT",
    connectionType: "api_key",
    capabilities: ["step"],
    version: "5.0.0",
    latestVersion: "5.0.0",
    connections: [
      { key: "api-key", label: "API Key / Bearer Token", type: "api_key", isDefault: true },
      { key: "basic", label: "Basic Auth", type: "basic", isDefault: false },
      { key: "oauth2", label: "OAuth 2.0", type: "oauth2", isDefault: false },
    ],
  },
  // Logic
  {
    key: "code",
    label: "Code",
    description: "Execute custom JavaScript or TypeScript",
    category: "logic",
    iconColor: "#8B5CF6",
    iconInitials: "{ }",
    connectionType: "none",
    capabilities: ["step"],
    version: "1.0.0",
    latestVersion: "1.0.0",
    connections: [],
    isPrivate: true,
  },
  {
    key: "branch",
    label: "Branch",
    description: "Conditional branching based on expressions",
    category: "logic",
    iconColor: "#EC4899",
    iconInitials: "BR",
    connectionType: "none",
    capabilities: ["step"],
    version: "1.0.0",
    latestVersion: "1.0.0",
    connections: [],
  },
  {
    key: "loop",
    label: "Loop",
    description: "Iterate over collections of data",
    category: "logic",
    iconColor: "#F97316",
    iconInitials: "LP",
    connectionType: "basic",
    capabilities: ["step"],
    version: "1.0.0",
    latestVersion: "1.0.0",
    connections: [
      { key: "basic", label: "Loop Connection", type: "basic", isDefault: true },
    ],
  },
  // Helpers
  {
    key: "log",
    label: "Log",
    description: "Log messages for debugging and monitoring",
    category: "helper",
    iconColor: "#6B7280",
    iconInitials: "LG",
    connectionType: "none",
    capabilities: ["step"],
    version: "1.0.0",
    latestVersion: "1.0.0",
    connections: [],
  },
  {
    key: "change-data-format",
    label: "Change Data Format",
    description: "Convert between JSON, XML, CSV formats",
    category: "helper",
    iconColor: "#14B8A6",
    iconInitials: "CD",
    connectionType: "basic",
    capabilities: ["step"],
    version: "1.1.0",
    latestVersion: "1.1.0",
    connections: [
      { key: "basic", label: "Data Format Connection", type: "basic", isDefault: true },
    ],
  },
  {
    key: "data-mapper",
    label: "Data Mapper",
    description: "Transform and map data between schemas",
    category: "helper",
    iconColor: "#06B6D4",
    iconInitials: "DM",
    connectionType: "api_key",
    capabilities: ["step"],
    version: "1.0.0",
    latestVersion: "1.0.0",
    connections: [
      { key: "api-key", label: "Data Mapper API Key", type: "api_key", isDefault: true },
    ],
  },
  {
    key: "filter",
    label: "Filter",
    description: "Filter data based on conditions",
    category: "helper",
    iconColor: "#84CC16",
    iconInitials: "FI",
    connectionType: "basic",
    capabilities: ["step"],
    version: "1.0.0",
    latestVersion: "1.0.0",
    connections: [
      { key: "basic", label: "Filter Connection", type: "basic", isDefault: true },
    ],
  },
]

export const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  app: "App Connectors",
  logic: "Logic",
  helper: "Helpers",
}

export const INITIAL_CONNECTION_CONFIG_VARS: ConnectionConfigVar[] = [
  // ── Salesforce: comprehensive coverage of all type × managedBy × status combos ──

  // 1. OAuth 2.0 + Customer + Connected (customer fills in their own OAuth creds)
  {
    id: "ccv-1",
    componentKey: "salesforce",
    connectionKey: "oauth2",
    name: "Salesforce OAuth (Customer)",
    type: "oauth2",
    managedBy: "customer",
    status: "connected",
    isRcv: true,
    isScv: false,
    template: "tpl-1",
    lastConfigured: "2026-02-28",
    usedBy: ["Lead Sync", "Opportunity Tracker"],
  },
  // 2. Service Account (basic) + Build Only + Connected (only for dev/test)
  {
    id: "ccv-2",
    componentKey: "salesforce",
    connectionKey: "service-account",
    name: "Salesforce Service Account (Build Only)",
    type: "basic",
    managedBy: "build-only",
    status: "connected",
    isRcv: false,
    isScv: true,
    template: "tpl-5",
    lastConfigured: "2026-02-15",
    usedBy: ["Lead Sync"],
  },
  // 3. OAuth 2.0 + Org-Global + Connected (org shares one set of OAuth creds across all customers)
  {
    id: "ccv-9",
    componentKey: "salesforce",
    connectionKey: "oauth2",
    name: "Salesforce OAuth (Org Global)",
    type: "oauth2",
    managedBy: "org-global",
    status: "connected",
    isRcv: true,
    isScv: false,
    template: "tpl-1",
    lastConfigured: "2026-03-01",
    usedBy: ["Bulk Export"],
  },
  // 4. OAuth 2.0 + Org-Customer + Pending (org sets up per-customer OAuth, not yet configured)
  {
    id: "ccv-10",
    componentKey: "salesforce",
    connectionKey: "oauth2",
    name: "Salesforce OAuth (Org per-Customer)",
    type: "oauth2",
    managedBy: "org-customer",
    status: "pending",
    isRcv: false,
    isScv: false,
  },
  // 5. API Key + Customer + Connected (customer provides their own API key)
  {
    id: "ccv-11",
    componentKey: "salesforce",
    connectionKey: "api-key",
    name: "Salesforce API Key (Customer)",
    type: "api_key",
    managedBy: "customer",
    status: "connected",
    isRcv: true,
    isScv: false,
    template: "tpl-2",
    lastConfigured: "2026-02-25",
    usedBy: ["Record Poller"],
  },
  // 6. API Key + Org-Customer + Disconnected (created but never configured)
  {
    id: "ccv-13",
    componentKey: "salesforce",
    connectionKey: "api-key",
    name: "Salesforce API Key (Org per-Customer)",
    type: "api_key",
    managedBy: "org-customer",
    status: "disconnected",
    isRcv: false,
    isScv: false,
  },
  // Slack - partially configured
  {
    id: "ccv-3",
    componentKey: "slack",
    connectionKey: "oauth2",
    name: "Slack OAuth",
    type: "oauth2",
    managedBy: "customer",
    status: "connected",
    isRcv: true,
    isScv: false,
    lastConfigured: "2026-03-01",
    usedBy: ["Alert Pipeline", "Customer Notifications"],
  },
  {
    id: "ccv-4",
    componentKey: "slack",
    connectionKey: "webhook",
    name: "Slack Webhook",
    type: "api_key",
    managedBy: "org-global",
    status: "pending",
    isRcv: false,
    isScv: true,
  },
  // HTTP - one connected
  {
    id: "ccv-5",
    componentKey: "http",
    connectionKey: "api-key",
    name: "HTTP API Key",
    type: "api_key",
    managedBy: "customer",
    status: "connected",
    isRcv: true,
    isScv: false,
    lastConfigured: "2026-03-02",
    usedBy: ["Webhook Relay"],
  },
  // SFTP - disconnected
  {
    id: "ccv-6",
    componentKey: "sftp",
    connectionKey: "basic",
    name: "SFTP Connection",
    type: "basic",
    managedBy: "customer",
    status: "disconnected",
    isRcv: true,
    isScv: false,
  },
  // HubSpot - pending
  {
    id: "ccv-7",
    componentKey: "hubspot",
    connectionKey: "oauth2",
    name: "HubSpot OAuth",
    type: "oauth2",
    managedBy: "customer",
    status: "pending",
    isRcv: false,
    isScv: false,
  },
  // AWS S3 - connected
  {
    id: "ccv-8",
    componentKey: "aws-s3",
    connectionKey: "access-key",
    name: "AWS S3 Access Key",
    type: "api_key",
    managedBy: "org-customer",
    status: "connected",
    isRcv: true,
    isScv: false,
    lastConfigured: "2026-02-20",
    usedBy: ["Data Export", "Backup Pipeline", "Lead Sync"],
  },
]

export const MOCK_TRIGGERS: Record<string, ComponentDetailItem[]> = {
  salesforce: [
    { name: "Record Created", description: "Fires when a new record is created" },
    { name: "Record Updated", description: "Fires when an existing record is updated" },
    { name: "Record Deleted", description: "Fires when a record is deleted" },
  ],
  slack: [
    { name: "New Message", description: "Fires when a message is posted to a channel" },
    { name: "Reaction Added", description: "Fires when a reaction is added to a message" },
  ],
  sftp: [
    { name: "File Added", description: "Fires when a new file is uploaded" },
    { name: "File Modified", description: "Fires when a file is changed" },
  ],
  "aws-s3": [
    { name: "Object Created", description: "Fires when an object is uploaded to a bucket" },
    { name: "Object Deleted", description: "Fires when an object is removed from a bucket" },
  ],
  dropbox: [
    { name: "File Added", description: "Fires when a new file is added to a folder" },
    { name: "File Changed", description: "Fires when a file is modified" },
  ],
  jira: [
    { name: "Issue Created", description: "Fires when a new issue is created" },
    { name: "Issue Updated", description: "Fires when an issue is updated" },
    { name: "Sprint Started", description: "Fires when a sprint is started" },
  ],
  hubspot: [
    { name: "Contact Created", description: "Fires when a new contact is created" },
    { name: "Deal Stage Changed", description: "Fires when a deal moves to a new stage" },
    { name: "Form Submitted", description: "Fires when a form submission is received" },
  ],
}

export const MOCK_DATA_SOURCES: Record<string, ComponentDetailItem[]> = {
  salesforce: [
    { name: "List Objects", description: "Retrieve a list of Salesforce object types" },
    { name: "List Fields", description: "Retrieve fields for a given object type" },
    { name: "List Records", description: "Retrieve records matching a query" },
  ],
  "google-sheets": [
    { name: "List Spreadsheets", description: "Retrieve available spreadsheets" },
    { name: "List Sheets", description: "Retrieve sheets within a spreadsheet" },
  ],
  hubspot: [
    { name: "List Pipelines", description: "Retrieve deal pipelines and stages" },
    { name: "List Properties", description: "Retrieve custom properties for an object type" },
  ],
  snowflake: [
    { name: "List Tables", description: "Retrieve tables in a schema" },
    { name: "List Columns", description: "Retrieve columns for a table" },
    { name: "List Schemas", description: "Retrieve schemas in a database" },
  ],
  postgresql: [
    { name: "List Tables", description: "Retrieve tables in a schema" },
    { name: "List Columns", description: "Retrieve columns for a table" },
  ],
  jira: [
    { name: "List Projects", description: "Retrieve available Jira projects" },
    { name: "List Issue Types", description: "Retrieve issue types for a project" },
  ],
}

export const MOCK_ACTIONS: Record<string, ComponentDetailItem[]> = {
  salesforce: [
    { name: "Create Record", description: "Create a new Salesforce record" },
    { name: "Update Record", description: "Update an existing record" },
    { name: "Query Records", description: "Query records using SOQL" },
    { name: "Delete Record", description: "Delete a record by ID" },
    { name: "Bulk Upsert", description: "Upsert multiple records at once" },
  ],
  slack: [
    { name: "Send Message", description: "Send a message to a channel" },
    { name: "Create Channel", description: "Create a new Slack channel" },
    { name: "Upload File", description: "Upload a file to Slack" },
    { name: "List Users", description: "List users in a workspace" },
  ],
  "aws-s3": [
    { name: "Put Object", description: "Upload an object to a bucket" },
    { name: "Get Object", description: "Download an object from a bucket" },
    { name: "List Objects", description: "List objects in a bucket" },
    { name: "Delete Object", description: "Delete an object from a bucket" },
  ],
  jira: [
    { name: "Create Issue", description: "Create a new Jira issue" },
    { name: "Update Issue", description: "Update an existing issue" },
    { name: "Transition Issue", description: "Change the issue status" },
    { name: "Add Comment", description: "Add a comment to an issue" },
  ],
  hubspot: [
    { name: "Create Contact", description: "Create a new contact in HubSpot" },
    { name: "Update Contact", description: "Update an existing contact" },
    { name: "Create Deal", description: "Create a new deal" },
    { name: "Search Records", description: "Search across HubSpot records" },
  ],
  http: [
    { name: "GET Request", description: "Make an HTTP GET request" },
    { name: "POST Request", description: "Make an HTTP POST request" },
    { name: "PUT Request", description: "Make an HTTP PUT request" },
    { name: "DELETE Request", description: "Make an HTTP DELETE request" },
  ],
  sftp: [
    { name: "Upload File", description: "Upload a file to SFTP server" },
    { name: "Download File", description: "Download a file from SFTP server" },
    { name: "List Files", description: "List files in a directory" },
  ],
  "google-sheets": [
    { name: "Read Rows", description: "Read rows from a spreadsheet" },
    { name: "Write Rows", description: "Write rows to a spreadsheet" },
    { name: "Create Sheet", description: "Create a new sheet in a spreadsheet" },
  ],
  dropbox: [
    { name: "Upload File", description: "Upload a file to Dropbox" },
    { name: "Download File", description: "Download a file from Dropbox" },
    { name: "List Files", description: "List files in a folder" },
  ],
  branch: [
    { name: "If Condition is Met", description: "Branch based on a boolean expression" },
    { name: "If Value Equals", description: "Branch when a value matches a target" },
    { name: "Select Executed Step Result", description: "Choose output from a prior step" },
  ],
  loop: [
    { name: "Repeat for Each", description: "Iterate over each item in a collection" },
    { name: "Repeat X Times", description: "Execute a fixed number of iterations" },
    { name: "Break Loop", description: "Exit the current loop early" },
  ],
  code: [
    { name: "Code Block", description: "Execute custom JavaScript or TypeScript code" },
  ],
  log: [
    { name: "Write Log Message", description: "Write a message to the execution log" },
    { name: "Write Metric(s)", description: "Record one or more numeric metrics" },
  ],
  "change-data-format": [
    { name: "JSON to XML", description: "Convert JSON data to XML format" },
    { name: "XML to JSON", description: "Convert XML data to JSON format" },
    { name: "CSV to JSON", description: "Parse CSV data into JSON objects" },
    { name: "JSON to CSV", description: "Convert JSON objects to CSV format" },
  ],
  "data-mapper": [
    { name: "Value Mapper", description: "Map a single value to a new value" },
    { name: "Value List Mapper", description: "Map a list of values to new values" },
  ],
  filter: [
    { name: "Filter", description: "Filter data based on conditional expressions" },
  ],
}

export const DEFAULT_ACTIONS = [
  { name: "Execute", description: "Run the default action" },
]

export const MOCK_CONNECTION_INPUTS: Record<string, Record<string, ConnectionInputField[]>> = {
  salesforce: {
    oauth2: [
      { key: "authorizeUrl", label: "Authorize URL", description: "The OAuth 2.0 Authorization URL for Salesforce", fieldType: "url", required: true, defaultValue: "https://login.salesforce.com/services/oauth2/authorize", writeOnly: false },
      { key: "tokenUrl", label: "Token URL", description: "The OAuth 2.0 Token URL for Salesforce", fieldType: "url", required: true, defaultValue: "https://login.salesforce.com/services/oauth2/token", writeOnly: false },
      { key: "revokeUrl", label: "Revoke URL", description: "The OAuth 2.0 Revoke URL for Salesforce", fieldType: "url", required: false, defaultValue: "https://login.salesforce.com/services/oauth2/revoke", writeOnly: false },
      { key: "clientId", label: "Consumer Key", description: "The Consumer Key from your Salesforce Connected App", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "clientSecret", label: "Consumer Secret", description: "The Consumer Secret from your Salesforce Connected App", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
    "api-key": [
      { key: "apiKey", label: "API Key", description: "Your Salesforce API key", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
    "service-account": [
      { key: "host", label: "Host", description: "The Salesforce instance URL", fieldType: "url", required: true, defaultValue: "", writeOnly: false },
      { key: "username", label: "Username", description: "The service account username", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "password", label: "Password", description: "The service account password", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  slack: {
    oauth2: [
      { key: "authorizeUrl", label: "Authorize URL", description: "The OAuth 2.0 Authorization URL for Slack", fieldType: "url", required: true, defaultValue: "https://slack.com/oauth/v2/authorize", writeOnly: false },
      { key: "tokenUrl", label: "Token URL", description: "The OAuth 2.0 Token URL for Slack", fieldType: "url", required: true, defaultValue: "https://slack.com/api/oauth.v2.access", writeOnly: false },
      { key: "clientId", label: "Client ID", description: "The Client ID from your Slack App", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "clientSecret", label: "Client Secret", description: "The Client Secret from your Slack App", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
    webhook: [
      { key: "webhookUrl", label: "Webhook URL", description: "The Slack Incoming Webhook URL", fieldType: "url", required: true, defaultValue: "", writeOnly: false },
    ],
  },
  sftp: {
    basic: [
      { key: "host", label: "Host", description: "The SFTP server hostname or IP address", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "port", label: "Port", description: "The SFTP server port", fieldType: "text", required: true, defaultValue: "22", writeOnly: false },
      { key: "username", label: "Username", description: "The SFTP username", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "password", label: "Password", description: "The SFTP password", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  "aws-s3": {
    "access-key": [
      { key: "accessKeyId", label: "Access Key ID", description: "Your AWS Access Key ID", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "secretAccessKey", label: "Secret Access Key", description: "Your AWS Secret Access Key", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
      { key: "region", label: "Region", description: "The AWS region (e.g. us-east-1)", fieldType: "text", required: true, defaultValue: "us-east-1", writeOnly: false },
    ],
    "role-arn": [
      { key: "roleArn", label: "Role ARN", description: "The ARN of the IAM role to assume", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "externalId", label: "External ID", description: "An optional external ID for the role assumption", fieldType: "text", required: false, defaultValue: "", writeOnly: false },
    ],
  },
  dropbox: {
    oauth2: [
      { key: "authorizeUrl", label: "Authorize URL", description: "The OAuth 2.0 Authorization URL for Dropbox", fieldType: "url", required: true, defaultValue: "https://www.dropbox.com/oauth2/authorize", writeOnly: false },
      { key: "tokenUrl", label: "Token URL", description: "The OAuth 2.0 Token URL for Dropbox", fieldType: "url", required: true, defaultValue: "https://api.dropboxapi.com/oauth2/token", writeOnly: false },
      { key: "clientId", label: "Client ID", description: "The App Key from your Dropbox App", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "clientSecret", label: "Client Secret", description: "The App Secret from your Dropbox App", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  "google-sheets": {
    oauth2: [
      { key: "authorizeUrl", label: "Authorize URL", description: "The OAuth 2.0 Authorization URL for Google", fieldType: "url", required: true, defaultValue: "https://accounts.google.com/o/oauth2/v2/auth", writeOnly: false },
      { key: "tokenUrl", label: "Token URL", description: "The OAuth 2.0 Token URL for Google", fieldType: "url", required: true, defaultValue: "https://oauth2.googleapis.com/token", writeOnly: false },
      { key: "revokeUrl", label: "Revoke URL", description: "The OAuth 2.0 Revoke URL for Google", fieldType: "url", required: false, defaultValue: "https://oauth2.googleapis.com/revoke", writeOnly: false },
      { key: "clientId", label: "Client ID", description: "The Client ID from your Google Cloud project", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "clientSecret", label: "Client Secret", description: "The Client Secret from your Google Cloud project", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
    "service-account": [
      { key: "serviceAccountJson", label: "Service Account JSON", description: "The JSON key file contents for the Google service account", fieldType: "textarea", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  jira: {
    "api-token": [
      { key: "host", label: "Jira Host", description: "Your Jira instance URL (e.g. mycompany.atlassian.net)", fieldType: "url", required: true, defaultValue: "", writeOnly: false },
      { key: "email", label: "Email", description: "The email address associated with your Jira account", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "apiToken", label: "API Token", description: "Your Jira API token", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
    oauth2: [
      { key: "authorizeUrl", label: "Authorize URL", description: "The OAuth 2.0 Authorization URL for Jira", fieldType: "url", required: true, defaultValue: "https://auth.atlassian.com/authorize", writeOnly: false },
      { key: "tokenUrl", label: "Token URL", description: "The OAuth 2.0 Token URL for Jira", fieldType: "url", required: true, defaultValue: "https://auth.atlassian.com/oauth/token", writeOnly: false },
      { key: "clientId", label: "Client ID", description: "The Client ID from your Atlassian OAuth app", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "clientSecret", label: "Client Secret", description: "The Client Secret from your Atlassian OAuth app", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  hubspot: {
    oauth2: [
      { key: "authorizeUrl", label: "Authorize URL", description: "The OAuth 2.0 Authorization URL for HubSpot", fieldType: "url", required: true, defaultValue: "https://app.hubspot.com/oauth/authorize", writeOnly: false },
      { key: "tokenUrl", label: "Token URL", description: "The OAuth 2.0 Token URL for HubSpot", fieldType: "url", required: true, defaultValue: "https://api.hubapi.com/oauth/v1/token", writeOnly: false },
      { key: "clientId", label: "Client ID", description: "The Client ID from your HubSpot App", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "clientSecret", label: "Client Secret", description: "The Client Secret from your HubSpot App", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
    "api-key": [
      { key: "apiKey", label: "API Key", description: "Your HubSpot API key", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  twilio: {
    "api-key": [
      { key: "accountSid", label: "Account SID", description: "Your Twilio Account SID", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "authToken", label: "Auth Token", description: "Your Twilio Auth Token", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  sendgrid: {
    "api-key": [
      { key: "apiKey", label: "API Key", description: "Your SendGrid API key", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  snowflake: {
    basic: [
      { key: "account", label: "Account", description: "Your Snowflake account identifier", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "username", label: "Username", description: "The Snowflake username", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "password", label: "Password", description: "The Snowflake password", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
      { key: "warehouse", label: "Warehouse", description: "The default warehouse to use", fieldType: "text", required: false, defaultValue: "", writeOnly: false },
      { key: "database", label: "Database", description: "The default database to use", fieldType: "text", required: false, defaultValue: "", writeOnly: false },
    ],
    "key-pair": [
      { key: "account", label: "Account", description: "Your Snowflake account identifier", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "username", label: "Username", description: "The Snowflake username", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "privateKey", label: "Private Key", description: "The RSA private key for authentication", fieldType: "textarea", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  postgresql: {
    basic: [
      { key: "host", label: "Host", description: "The PostgreSQL server hostname", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "port", label: "Port", description: "The PostgreSQL server port", fieldType: "text", required: true, defaultValue: "5432", writeOnly: false },
      { key: "database", label: "Database", description: "The database name", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "username", label: "Username", description: "The PostgreSQL username", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "password", label: "Password", description: "The PostgreSQL password", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
  http: {
    "api-key": [
      { key: "apiKey", label: "API Key / Bearer Token", description: "The API key or bearer token for authentication", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
      { key: "headerName", label: "Header Name", description: "The header name to send the API key in (e.g. Authorization)", fieldType: "text", required: false, defaultValue: "Authorization", writeOnly: false },
    ],
    basic: [
      { key: "host", label: "Base URL", description: "The base URL for the HTTP endpoint", fieldType: "url", required: true, defaultValue: "", writeOnly: false },
      { key: "username", label: "Username", description: "The username for basic auth", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "password", label: "Password", description: "The password for basic auth", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
    oauth2: [
      { key: "authorizeUrl", label: "Authorize URL", description: "The OAuth 2.0 Authorization URL", fieldType: "url", required: true, defaultValue: "", writeOnly: false },
      { key: "tokenUrl", label: "Token URL", description: "The OAuth 2.0 Token URL", fieldType: "url", required: true, defaultValue: "", writeOnly: false },
      { key: "clientId", label: "Client ID", description: "The OAuth 2.0 Client ID", fieldType: "text", required: true, defaultValue: "", writeOnly: false },
      { key: "clientSecret", label: "Client Secret", description: "The OAuth 2.0 Client Secret", fieldType: "password", required: true, defaultValue: "", writeOnly: true },
    ],
  },
}

export const MOCK_TEMPLATE_PREFILLED_VALUES: Record<string, Record<string, string>> = {
  "tpl-1": {
    authorizeUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    revokeUrl: "https://login.salesforce.com/services/oauth2/revoke",
    clientId: "3MVG9d8..._PROD_KEY",
  },
  "tpl-2": {
    apiKey: "sf_prod_key_••••••••••••",
  },
  "tpl-3": {
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    clientId: "123456789.987654321",
  },
  "tpl-4": {
    authorizeUrl: "https://test.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://test.salesforce.com/services/oauth2/token",
    revokeUrl: "https://test.salesforce.com/services/oauth2/revoke",
    clientId: "3MVG9d8..._SANDBOX_KEY",
  },
  "tpl-5": {
    host: "https://mycompany.my.salesforce.com",
    username: "integration-svc@mycompany.com",
  },
}
