// import { ComponentMeta } from '../../../component';
import { ComponentID } from '../../../component';
import { ComponentStatus } from '../../workspace-component/component-status';
import { DeprecationInfo } from '../../../deprecation';
import { Descriptor } from '../../../environments';
import { ComponentModel } from '../../../component';
import { ComponentModelProps } from '../../../component';

export type WorkspaceModelComponent = {
  id: ComponentID;
  status: ComponentStatus;
  deprecation: DeprecationInfo;
  env: Descriptor;
};

export type WorkspaceProps = {
  name: string;
  path: string;
  components: ComponentModelProps[];
};

export class Workspace {
  constructor(
    /**
     * name of the workspace.
     */
    readonly name: string,

    /**
     * absolute path of the workspace.
     */
    readonly path: string,

    /**
     * components container in the workspace.
     */
    readonly components: ComponentModel[]
  ) {}

  static from({ name, path, components }: WorkspaceProps) {
    return new Workspace(
      name,
      path,
      components.map((value) => {
        return ComponentModel.from(value);
      })
    );
  }

  static empty() {
    return new Workspace('', '', []);
  }
}