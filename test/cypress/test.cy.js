describe('顧客情報入力フォームのテスト', () => {
  it('顧客情報を入力して送信し、成功メッセージを確認する', () => {
    cy.visit('/nishi/customer/add.html'); // テスト対象のページにアクセス
    cy.window().then((win) => {
      // windowのalertをスタブ化し、エイリアスを設定
      cy.stub(win, 'alert').as('alertStub');
    });


    // テストデータの読み込み
    cy.fixture('customerData').then((data) => {
      // フォームの入力フィールドにテストデータを入力
      const uniqueContactNumber = `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      cy.get('#companyName').type(data.companyName);
      cy.get('#industry').type(data.industry);
      cy.get('#contact').type(uniqueContactNumber);
      cy.get('#location').type(data.location);
    });

    // フォームの送信
    cy.get('#customer-form').submit();
  });
});


describe('顧客一覧画面のテスト', () => {
  //テストデータ
  const testData = [
    {
    customer_id : 1,
    company_name : 'テスト株式会社',
    industry : 'IT',
    contact : '03-1111-1111',
    location : '東京都新宿区',
    created_date : Date.now(),
    updated_date : Date.now()
    }
  ];

  it('顧客一覧ページを表示し、会社名をクリックすると詳細ページに遷移する', () => {
    cy.intercept('GET', '/api_natsuki_fujii/customers', testData).as('customerData');
    cy.visit('/natsuki_fujii/customer/list.html'); // テスト対象のページにアクセス
    cy.wait('@customerData');

    cy.get('#customer-list tr').each(($row, index) => {
      //各セルにテストデータが入っているか確認
        cy.wrap($row).find('td').eq(0).should('contain', index + 1);
        cy.wrap($row).find('td').eq(1).should('contain', testData[0].company_name);
        cy.wrap($row).find('td').eq(2).should('contain', testData[0].contact);
    });

    cy.intercept('POST', '/api_natsuki_fujii/company', testData[0].company_name).as('customerName');
    cy.get('a').click();
    cy.wait('@customerName');
    cy.url().should('include', '/natsuki_fujii/customer/detail.html');
  });
});