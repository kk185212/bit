import { FS as AnyFS } from '@teambit/any-fs';
import { Capsule as CapsuleOrchestrator } from '../capsule';

export default class Component {
  constructor(
    /**
     * instance of the capsule orchestrator
     */
    private capsuleOrchestrator: CapsuleOrchestrator
  ) {}

  /**
   * versions of the component.
   */
  readonly versions = [];

  /**
   * the head version of the component.
   */
  readonly head = this.versions[0];

  modified() {}

  checkout() {
    const version = this.versions.find(x => x);
    this.head;
  }

  get dependencyGraph() {
    return '';
  }

  getCapsule() {
    return this.capsuleOrchestrator.create(this, {});
  }

  write(path: string, fs?: AnyFS) {}
}