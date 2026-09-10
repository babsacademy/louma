type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type RouteDefinition = {
    url: string;
    method: HttpMethod;
};

export const toForm = ({ url, method }: RouteDefinition) => ({
    action: url,
    method,
});
