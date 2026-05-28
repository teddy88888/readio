const handleApi = require("./handler");

module.exports = function api(request, response) {
  const routePath = request.query && request.query.path;
  const requestPath = routePath ? `/api/${Array.isArray(routePath) ? routePath.join("/") : routePath}` : undefined;
  return handleApi(request, response, {
    baseUrl: `https://${request.headers.host || "localhost"}`,
    requestPath
  });
};
