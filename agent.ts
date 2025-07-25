export default class Agent {
  private agent;

  constructor(agent) {
    this.agent = agent;
    this.agent.logger.info('[egg-rate-limit] start to init egg-rate-limit agent!');
  }

  async configWillLoad() {
    this.agent.logger.info('[egg-rate-limit] agent configWillLoad');
  }

  async beforeStart() {
    this.agent.logger.info('[egg-rate-limit] agent beforeStart');
  }

  async didLoad() {
    this.agent.logger.info('[egg-rate-limit] agent didLoad');
  }

  async didReady() {
    this.agent.logger.info('[egg-rate-limit] agent didReady');
  }

  async serverDidReady() {
    this.agent.logger.info('[egg-rate-limit] agent serverDidReady');
  }

  async beforeClose() {
    this.agent.logger.info('[egg-rate-limit] agent beforeClose');
  }
}