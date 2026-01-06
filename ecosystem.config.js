module.exports = {
  apps: [
    // ======================
    // API / MAIN BACKEND
    // ======================
    {
      name: "stable-backend-api",

      script: "npm",
      args: "run start:prod",

      pre_start: "npm run build",

      exec_mode: "fork",
      instances: 1,

      env: {
        NODE_ENV: "development"
      }
    },

    // ======================
    // WORKER PROCESS
    // ======================
    {
      name: "stable-backend-worker",

      script: "npm",
      args: "run start:worker",

      // worker ko bhi build chahiye
      pre_start: "npm run build",

      exec_mode: "fork",
      instances: 1,

      env: {
        NODE_ENV: "development"
      }
    }
  ]
};

