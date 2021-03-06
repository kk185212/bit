import { EnvService, ExecutionContext } from '@teambit/environments';
import { Logger } from '@teambit/logger';
import { Workspace } from '@teambit/workspace';
import { Component } from '@teambit/component';
import { BuildPipe, BuildPipeResults } from './build-pipe';
import { TaskSlot } from './builder.main.runtime';
import { BuildTask } from './build-task';
import { ArtifactFactory } from './artifact';

export type BuildServiceResults = {
  id: string;
  buildResults: BuildPipeResults;
  components: Component[];
  errors?: [];
};

export class BuilderService implements EnvService<BuildServiceResults> {
  constructor(
    /**
     * workspace extension.
     */
    private workspace: Workspace,

    /**
     * logger extension.
     */
    private logger: Logger,

    /**
     * task slot (e.g tasks registered by other extensions.).
     */
    private taskSlot: TaskSlot,

    /**
     * for now, it can be either "getBuildPipe" or "getDeployPipe".
     * a method with such name should be implemented on the env in order to run the pipe tasks.
     */
    private pipeNameOnEnv: string,

    /**
     * pipe name to display on the console during the execution
     */
    private displayPipeName: string,

    private artifactFactory: ArtifactFactory
  ) {}

  /**
   * runs a pipeline of tasks on all components in the execution context.
   */
  async run(context: ExecutionContext): Promise<BuildServiceResults> {
    const title = `running ${this.displayPipeName} pipe for environment ${context.id}, total ${context.components.length} components`;
    const longProcessLogger = this.logger.createLongProcessLogger(title);
    this.logger.consoleTitle(title);
    // make build pipe accessible throughout the context.
    if (context.env.getPipe) {
      // @todo: remove once this confusion is over
      throw new Error(
        `Fatal: a breaking API has introduced. Please change "getPipe()" method on "${context.id}" to "getBuildPipe()"`
      );
    }
    const buildTasks: BuildTask[] = context.env[this.pipeNameOnEnv] ? context.env[this.pipeNameOnEnv]() : [];

    // TODO: refactor end and start task execution to a separate method
    const slotsTasks = this.taskSlot.values();
    const tasksAtStart: BuildTask[] = [];
    const tasksAtEnd: BuildTask[] = [];
    // @todo: develop a better mechanism. e.g. I want "preview" and "publish" to be in the end
    // but preview before publish. in Drupal for example this is resolved by a numeric "weight" field
    slotsTasks.forEach((task) => {
      if (task.location === 'start') {
        tasksAtStart.push(task);
        return;
      }
      if (task.location === 'end') {
        tasksAtEnd.push(task);
        return;
      }
      tasksAtStart.push(task);
    });

    // merge with extension registered tasks.
    const mergedTasks = [...tasksAtStart, ...buildTasks, ...tasksAtEnd];
    const buildPipe = BuildPipe.from(mergedTasks, this.logger, this.artifactFactory);
    this.logger.info(`start running building pipe for "${context.id}". total ${buildPipe.tasks.length} tasks`);

    const componentIds = context.components.map((component) => component.id.toString());
    const buildContext = Object.assign(context, {
      capsuleGraph: await this.workspace.createNetwork(componentIds, { getExistingAsIs: true }),
    });
    const buildResults = await buildPipe.execute(buildContext);

    longProcessLogger.end();
    this.logger.consoleSuccess();
    return { id: context.id, buildResults, components: buildContext.components };
  }
}
