Schema.prisma:
- enum for status instead of raw string in tab and split
- add indexes for common relation lookups, @@index[tabId] @@index([splitId]) on AuditLog    

