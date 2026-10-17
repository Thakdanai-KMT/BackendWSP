import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { CreateCustomerDto } from './dto/create-customer.dto.js';
import type { UpdateCustomerDto } from './dto/update-customer.dto.js';
import type { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto.js';

export interface CustomerBalance {
  customer_id: string;
  credit_total: number;
  paid_total: number;
  balance: number;
  overdue_amount: number;
  oldest_due_date: string | null;
}

interface BalanceRow {
  customer_id: string;
  credit_total: number | string | null;
  paid_total: number | string | null;
  balance: number | string | null;
  overdue_amount: number | string | null;
  oldest_due_date: string | null;
}

export interface LedgerEntry {
  id: string;
  type: 'CREDIT_SALE' | 'PAYMENT';
  date: string;
  amount: number;
  status: string;
  due_date: string | null;
  method: string | null;
  note: string | null;
  void_reason: string | null;
  running_balance: number;
}
export interface CreditBillItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreditBill {
  sale_id: string;
  created_at: string;
  total_amount: number;
  due_date: string | null;
  credit_note: string | null;
  sale_status: 'COMPLETED' | 'CANCELLED';
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED';
  paid_amount: number;
  remaining: number;
  is_overdue: boolean;
  days_overdue: number;
  settled_at: string | null;
  items: CreditBillItem[];
}

interface CreditBillRow {
  sale_id: string;
  created_at: string;
  total_amount: number | string;
  due_date: string | null;
  credit_note: string | null;
  sale_status: 'COMPLETED' | 'CANCELLED';
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED';
  paid_amount: number | string;
  remaining: number | string;
  is_overdue: boolean;
  days_overdue: number;
  settled_at: string | null;
  items: CreditBillItem[] | null;
}
const toCents = (n: number) => Math.round(n * 100);

@Injectable()
export class CustomersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(search?: string) {
    const client = this.supabaseService.getClient();
    let query = client.from('customers').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query.order('full_name', {
      ascending: true,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch customers: ${error.message}`,
      );
    }
    return { data, total: count ?? data.length };
  }

  async findOne(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch customer: ${error.message}`,
      );
    }
    if (!data) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return data;
  }

  async create(dto: CreateCustomerDto) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('customers')
      .insert(dto)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('A customer with this data already exists');
      }
      throw new InternalServerErrorException(
        `Failed to create customer: ${error.message}`,
      );
    }
    return data;
  }

  async update(id: string, dto: UpdateCustomerDto, actorId: string) {
    const oldValue = await this.findOne(id);

    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('customers')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update customer: ${error.message}`,
      );
    }

    this.auditService.log({
      actorId,
      action: 'UPDATE',
      resourceType: 'customer',
      resourceId: id,
      oldValue,
      newValue: data,
    });

    return data;
  }

  async remove(id: string) {
    await this.findOne(id);
    const client = this.supabaseService.getClient();
    const { error } = await client.from('customers').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Cannot delete customer: still referenced by existing sales',
        );
      }
      throw new InternalServerErrorException(
        `Failed to delete customer: ${error.message}`,
      );
    }
    return { message: 'Customer deleted successfully' };
  }

  // ---------------------------------------------------------------
  // ลูกหนี้ (ขายเชื่อ / รับชำระ)
  // ---------------------------------------------------------------

  private toBalance(row: BalanceRow): CustomerBalance {
    return {
      customer_id: row.customer_id,
      credit_total: Number(row.credit_total ?? 0),
      paid_total: Number(row.paid_total ?? 0),
      balance: Number(row.balance ?? 0),
      overdue_amount: Number(row.overdue_amount ?? 0),
      oldest_due_date: row.oldest_due_date ?? null,
    };
  }

  // ยอดค้างของลูกค้าทุกคนที่เคยมีรายการเชื่อหรือรับชำระ
  async getBalances() {
    const client = this.supabaseService.getClient();
    const { data, error } = await client.rpc('get_customer_balances');

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch customer balances: ${error.message}`,
      );
    }

    const rows = ((data ?? []) as BalanceRow[]).map((r) => this.toBalance(r));
    return { data: rows, total: rows.length };
  }

  async getBalance(customerId: string): Promise<CustomerBalance> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client.rpc('get_customer_balances', {
      p_customer_id: customerId,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch customer balance: ${error.message}`,
      );
    }

    const row = ((data ?? []) as BalanceRow[])[0];
    return row
      ? this.toBalance(row)
      : {
          customer_id: customerId,
          credit_total: 0,
          paid_total: 0,
          balance: 0,
          overdue_amount: 0,
          oldest_due_date: null,
        };
  }

  // สมุดบัญชีของลูกค้า: บิลขายเชื่อกับการรับชำระ เรียงใหม่ไปเก่า พร้อมยอดคงเหลือสะสม
  async getLedger(id: string) {
    const customer = await this.findOne(id);
    const client = this.supabaseService.getClient();

    const [salesRes, paymentsRes, summary] = await Promise.all([
      client
        .from('sales')
        .select('id, created_at, total_amount, status, due_date, credit_note')
        .eq('customer_id', id)
        .eq('payment_method', 'CREDIT'),
      client
        .from('customer_payments')
        .select('id, paid_at, amount, method, note, status, void_reason')
        .eq('customer_id', id),
      this.getBalance(id),
    ]);

    if (salesRes.error) {
      throw new InternalServerErrorException(
        `Failed to fetch credit sales: ${salesRes.error.message}`,
      );
    }
    if (paymentsRes.error) {
      throw new InternalServerErrorException(
        `Failed to fetch payments: ${paymentsRes.error.message}`,
      );
    }

    const entries: LedgerEntry[] = [
      ...(salesRes.data ?? []).map(
        (s): LedgerEntry => ({
          id: s.id,
          type: 'CREDIT_SALE',
          date: s.created_at,
          amount: Number(s.total_amount),
          status: s.status,
          due_date: s.due_date ?? null,
          method: null,
          note: s.credit_note ?? null,
          void_reason: null,
          running_balance: 0,
        }),
      ),
      ...(paymentsRes.data ?? []).map(
        (p): LedgerEntry => ({
          id: p.id,
          type: 'PAYMENT',
          date: p.paid_at,
          amount: Number(p.amount),
          status: p.status,
          due_date: null,
          method: p.method,
          note: p.note ?? null,
          void_reason: p.void_reason ?? null,
          running_balance: 0,
        }),
      ),
    ];

    // คำนวณยอดสะสมจากเก่าไปใหม่ นับเฉพาะรายการที่ยังมีผล (บิลสำเร็จ / รับชำระที่ไม่ถูกยกเลิก)
    entries.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    let running = 0;
    for (const e of entries) {
      const active = e.status === 'COMPLETED' || e.status === 'ACTIVE';
      if (active) {
        running += e.type === 'CREDIT_SALE' ? e.amount : -e.amount;
      }
      e.running_balance = Math.round(running * 100) / 100;
    }
    entries.reverse();

    return { customer, summary, entries };
  }

  async addPayment(
    customerId: string,
    dto: CreateCustomerPaymentDto,
    actorId: string,
  ) {
    await this.findOne(customerId);

    if (
      dto.paid_at &&
      new Date(dto.paid_at).getTime() > Date.now() + 5 * 60 * 1000
    ) {
      throw new BadRequestException('ไม่สามารถบันทึกวันที่รับชำระเป็นอนาคตได้');
    }

    const before = await this.getBalance(customerId);
    const outstanding = Math.max(0, before.balance);

    if (!dto.confirm_overpay && toCents(dto.amount) > toCents(outstanding)) {
      throw new ConflictException({
        message: `ยอดที่รับ ${dto.amount.toLocaleString('th-TH')} บาท มากกว่ายอดค้างชำระ ${outstanding.toLocaleString('th-TH')} บาท ส่วนที่เกินจะถูกเก็บเป็นเครดิตของลูกค้า`,
        requires_confirmation: true,
        outstanding,
      });
    }

    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('customer_payments')
      .insert({
        customer_id: customerId,
        amount: dto.amount,
        method: dto.method,
        paid_at: dto.paid_at ?? new Date().toISOString(),
        note: dto.note ?? null,
        received_by: actorId,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to record payment: ${error.message}`,
      );
    }

    this.auditService.log({
      actorId,
      action: 'CREATE',
      resourceType: 'customer_payment',
      resourceId: data.id,
      oldValue: null,
      newValue: data,
    });

    const summary = await this.getBalance(customerId);
    return { payment: data, summary };
  }

  async voidPayment(
    customerId: string,
    paymentId: string,
    reason: string,
    actorId: string,
  ) {
    await this.findOne(customerId);
    const client = this.supabaseService.getClient();

    const { data: existing, error: findError } = await client
      .from('customer_payments')
      .select('*')
      .eq('id', paymentId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (findError) {
      throw new InternalServerErrorException(
        `Failed to fetch payment: ${findError.message}`,
      );
    }
    if (!existing) {
      throw new NotFoundException('ไม่พบรายการรับชำระนี้');
    }
    if (existing.status === 'VOIDED') {
      throw new ConflictException('รายการรับชำระนี้ถูกยกเลิกไปแล้ว');
    }

    const { data, error } = await client
      .from('customer_payments')
      .update({
        status: 'VOIDED',
        voided_at: new Date().toISOString(),
        voided_by: actorId,
        void_reason: reason,
      })
      .eq('id', paymentId)
      .eq('status', 'ACTIVE')
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to void payment: ${error.message}`,
      );
    }
    if (!data) {
      throw new ConflictException('รายการรับชำระนี้ถูกยกเลิกไปแล้ว');
    }

    this.auditService.log({
      actorId,
      action: 'UPDATE',
      resourceType: 'customer_payment',
      resourceId: paymentId,
      oldValue: existing,
      newValue: data,
    });

    const summary = await this.getBalance(customerId);
    return { payment: data, summary };
  }
    // ภาพรวมเครดิตของลูกค้าหนึ่งคน: รายบิล ประวัติรับชำระ พฤติกรรมการชำระ
  async getCreditOverview(id: string) {
    const customer = await this.findOne(id);
    const client = this.supabaseService.getClient();

    const [billsRes, paymentsRes, summary] = await Promise.all([
      client.rpc('get_customer_credit_bills', { p_customer_id: id }),
      client
        .from('customer_payments')
        .select('id, paid_at, amount, method, note, status, void_reason, received_by')
        .eq('customer_id', id)
        .order('paid_at', { ascending: false }),
      this.getBalance(id),
    ]);

    if (billsRes.error) {
      throw new InternalServerErrorException(
        `Failed to fetch credit bills: ${billsRes.error.message}`,
      );
    }
    if (paymentsRes.error) {
      throw new InternalServerErrorException(
        `Failed to fetch payments: ${paymentsRes.error.message}`,
      );
    }

    const bills: CreditBill[] = ((billsRes.data ?? []) as CreditBillRow[]).map(
      (b) => ({
        sale_id: b.sale_id,
        created_at: b.created_at,
        total_amount: Number(b.total_amount),
        due_date: b.due_date ?? null,
        credit_note: b.credit_note ?? null,
        sale_status: b.sale_status,
        payment_status: b.payment_status,
        paid_amount: Number(b.paid_amount),
        remaining: Number(b.remaining),
        is_overdue: b.is_overdue,
        days_overdue: Number(b.days_overdue),
        settled_at: b.settled_at ?? null,
        items: (b.items ?? []).map((i) => ({
          product_name: i.product_name,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          subtotal: Number(i.subtotal),
        })),
      }),
    );

    // ชื่อผู้รับชำระ (จำนวนผู้รับน้อย จึงดึงด้วย in ได้ปลอดภัย)
    const rawPayments = paymentsRes.data ?? [];
    const receiverIds = [
      ...new Set(rawPayments.map((p) => p.received_by as string)),
    ];
    let names = new Map<string, string>();
    if (receiverIds.length > 0) {
      const { data: users } = await client
        .from('users')
        .select('id, full_name')
        .in('id', receiverIds);
      names = new Map(
        (users ?? []).map((u) => [u.id as string, u.full_name as string]),
      );
    }

    const payments = rawPayments.map((p) => ({
      id: p.id as string,
      paid_at: p.paid_at as string,
      amount: Number(p.amount),
      method: p.method as string,
      note: (p.note ?? null) as string | null,
      status: p.status as string,
      void_reason: (p.void_reason ?? null) as string | null,
      received_by_name: names.get(p.received_by as string) ?? null,
    }));

    // พฤติกรรมการชำระ: นับเฉพาะบิลที่ขายสำเร็จ
    const completed = bills.filter((b) => b.sale_status === 'COMPLETED');
    const paidBills = completed.filter((b) => b.payment_status === 'PAID');
    const openBills = completed.filter((b) => b.payment_status !== 'PAID');
    const overdueBills = openBills.filter((b) => b.is_overdue);
    const dueEnd = (d: string) => Date.parse(`${d}T23:59:59.999+07:00`);

    let paidOnTime = 0;
    let paidLate = 0;
    let daysSum = 0;
    let daysCount = 0;
    for (const b of paidBills) {
      if (!b.settled_at) continue;
      const settled = Date.parse(b.settled_at);
      daysSum += (settled - Date.parse(b.created_at)) / 86_400_000;
      daysCount += 1;
      if (b.due_date) {
        if (settled <= dueEnd(b.due_date)) paidOnTime += 1;
        else paidLate += 1;
      }
    }

    const activePayments = payments.filter((p) => p.status === 'ACTIVE');
    const stats = {
      credit_bills_total: completed.length,
      paid_bills: paidBills.length,
      open_bills: openBills.length,
      overdue_bills: overdueBills.length,
      overdue_amount: overdueBills.reduce((a, b) => a + b.remaining, 0),
      max_days_overdue: Math.max(0, ...overdueBills.map((b) => b.days_overdue)),
      paid_on_time: paidOnTime,
      paid_late: paidLate,
      avg_days_to_settle:
        daysCount > 0 ? Math.round((daysSum / daysCount) * 10) / 10 : null,
      ever_overdue: paidLate > 0 || overdueBills.length > 0,
      first_credit_at:
        completed.length > 0
          ? completed.reduce(
              (min, b) => (b.created_at < min ? b.created_at : min),
              completed[0].created_at,
            )
          : null,
      last_payment_at: activePayments.length > 0 ? activePayments[0].paid_at : null,
    };

    const creditLimit =
      customer.credit_limit === null || customer.credit_limit === undefined
        ? null
        : Number(customer.credit_limit);

    return {
      customer,
      summary: {
        ...summary,
        credit_limit: creditLimit,
        credit_available:
          creditLimit === null ? null : creditLimit - summary.balance,
      },
      stats,
      bills,
      payments,
    };
  }
}