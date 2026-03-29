export type GithubPushEvenet = {
    type: "github.push",
    payload: {
        repo: string,
        commitId: string,
        branch: string,
        author: string
    }
}

export type Event = GithubPushEvenet

