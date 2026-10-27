export const USER_QUERY = /* GraphQL */ `
  query User($login: String!) {
    user(login: $login) {
      login
      name
      avatarUrl(size: 400)
      bio
      location
      company
      websiteUrl
      twitterUsername
      createdAt
      url
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(ownerAffiliations: OWNER, privacy: PUBLIC) {
        totalCount
      }
      organizations(first: 100) {
        nodes {
          login
        }
      }
    }
  }
`;

export const PULL_REQUEST_SEARCH_QUERY = /* GraphQL */ `
  query PullRequests($q: String!, $after: String) {
    search(query: $q, type: ISSUE, first: 100, after: $after) {
      issueCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          state
          createdAt
          mergedAt
          closedAt
          repository {
            nameWithOwner
            name
            url
            description
            stargazerCount
            forkCount
            isFork
            isArchived
            primaryLanguage {
              name
              color
            }
            owner {
              login
              avatarUrl(size: 128)
            }
          }
        }
      }
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`;

export const PULL_REQUEST_COUNT_QUERY = /* GraphQL */ `
  query PullRequestCount($q: String!) {
    search(query: $q, type: ISSUE, first: 1) {
      issueCount
    }
  }
`;

export const USER_SEARCH_QUERY = /* GraphQL */ `
  query SearchUsers($q: String!) {
    search(query: $q, type: USER, first: 6) {
      nodes {
        ... on User {
          login
          name
          avatarUrl(size: 64)
        }
      }
    }
  }
`;
