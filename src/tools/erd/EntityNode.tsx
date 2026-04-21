import { Handle, Position, type Node } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ErdEntityData } from './helpers';

const EntityNode = ({ data, selected }: NodeProps<Node<ErdEntityData>>) => {
  return (
    <div className={`erd-node${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="erd-node-header">{data.name || '(無名)'}</div>

      {data.fields.length === 0 ? (
        <div className="erd-node-empty">フィールドなし</div>
      ) : (
        <table className="erd-node-table">
          <tbody>
            {data.fields.map(f => (
              <tr key={f.id} className={`erd-node-row${f.isPK ? ' pk' : ''}${f.isFK ? ' fk' : ''}`}>
                <td className="erd-node-badge-cell">
                  {f.isPK && <span className="erd-badge pk">PK</span>}
                  {f.isFK && <span className="erd-badge fk">FK</span>}
                </td>
                <td className="erd-node-name">{f.name || '—'}</td>
                <td className="erd-node-type">{f.type}{f.nullable ? '?' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EntityNode;
