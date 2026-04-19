"""predictionStore_columns_changes

Revision ID: 84d65c29ad9c
Revises: 510bef834889
Create Date: 2026-04-16 19:06:20.982940

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84d65c29ad9c'
down_revision: Union[str, Sequence[str], None] = '510bef834889'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('predictions', sa.Column('verification_status', sa.String(), nullable=True))
    
    # Create index for faster queries
    op.create_index('ix_predictions_verification_status', 'predictions', ['verification_status'])
    
    # Backfill existing data (set status based on whether actual_class exists)
    op.execute("""
        UPDATE predictions 
        SET verification_status = CASE 
            WHEN actual_class IS NULL THEN 'pending'
            WHEN actual_class = prediction_class THEN 'verified'
            ELSE 'corrected'
        END
    """)
    
    # Set default for future inserts
    op.alter_column('predictions', 'verification_status', 
                    server_default='pending', 
                    nullable=True)
    


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_predictions_verification_status', table_name='predictions')
    op.drop_column('predictions', 'verification_status')
    
