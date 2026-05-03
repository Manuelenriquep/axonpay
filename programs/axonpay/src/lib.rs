use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AxonPayXQvN2C8hRkZ9wY1zTbPvF5uD6gH8jK3mN4pQ");

const ADMIN_PUBKEY: Pubkey = pubkey!("3on54CLewSbVV3QR9FQMbzRWeiV9he6mFFjHPS8qBJjy");

const FEE_BASIS_POINTS: u64 = 50; // 0.5% de comisión

#[program]
pub mod axonpay {
    use super::*;

    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        amount: u64,
        payment_id: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let admin_fee = amount
            .checked_mul(FEE_BASIS_POINTS)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;
        let merchant_amount = amount
            .checked_sub(admin_fee)
            .ok_or(ErrorCode::MathOverflow)?;

        token::transfer(ctx.accounts.transfer_to_merchant(), merchant_amount)?;
        token::transfer(ctx.accounts.transfer_to_admin(), admin_fee)?;

        let clock = Clock::get()?;

        let payment = &mut ctx.accounts.payment;
        payment.payer = ctx.accounts.payer.key();
        payment.merchant = ctx.accounts.merchant.key();
        payment.amount = amount;
        payment.fee = admin_fee;
        payment.payment_id = payment_id;
        payment.timestamp = clock.unix_timestamp;

        emit!(PaymentProcessed {
            merchant: ctx.accounts.merchant.key(),
            payer: ctx.accounts.payer.key(),
            amount,
            fee: admin_fee,
            payment_id,
            timestamp: payment.timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(payment_id: u64)]
pub struct ProcessPayment<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8,
        seeds = [b"payment", payer.key().as_ref(), payment_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub payment: Account<'info, Payment>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, constraint = payer_token_account.owner == payer.key())]
    pub payer_token_account: Account<'info, TokenAccount>,

    /// CHECK: la cuenta del comercio se valida mediante su token account asociado
    pub merchant: UncheckedAccount<'info>,

    #[account(mut, constraint = merchant_token_account.owner == merchant.key())]
    pub merchant_token_account: Account<'info, TokenAccount>,

    #[account(mut, constraint = admin_fee_wallet.owner == ADMIN_PUBKEY)]
    pub admin_fee_wallet: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Payment {
    pub payer: Pubkey,
    pub merchant: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub payment_id: u64,
    pub timestamp: i64,
}

#[event]
pub struct PaymentProcessed {
    pub merchant: Pubkey,
    pub payer: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub payment_id: u64,
    pub timestamp: i64,
}

impl<'info> ProcessPayment<'info> {
    fn transfer_to_merchant(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.payer_token_account.to_account_info().clone(),
            to: self.merchant_token_account.to_account_info().clone(),
            authority: self.payer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }

    fn transfer_to_admin(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.payer_token_account.to_account_info().clone(),
            to: self.admin_fee_wallet.to_account_info().clone(),
            authority: self.payer.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info().clone(), cpi_accounts)
    }
}
