export interface BuildInfo {
    time: string;
    commitInfo: {
        commitId: string;
        commitMessage: string;
        branchName: string;
        fileStats: string;
        tagInfo: string[];
    };
    announcement: {
        switch: boolean;
        info: string;
    };
    updateInfo: {
        switch: boolean;
        header: string;
        body: string;
    };
    weather: {
        switch: {
            info: boolean;
            warn: boolean;
        };
        config: {
            api: string;
            province: string;
            city: string;
        };
        info: {
            title: {
                apply: string;
                cancel: string;
            };
            body: {
                apply: string;
                cancel: string;
            };
        };
    };
}