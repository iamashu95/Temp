<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output indent="yes" method="xml" encoding="UTF-8" />
      	<xsl:template match="node()|@*">
		<xsl:copy>
			<xsl:apply-templates select="node()|@*"/>
		</xsl:copy>
	 </xsl:template>
	
	 <xsl:variable name="paymentKey"> 
		<xsl:value-of select="/InvoiceDetail/InvoiceHeader/CollectionDetails/CollectionDetail/PaymentMethod[@PaymentType='OMS_ACCOMMODATION']/@PaymentKey" />
	 </xsl:variable>
	
         <xsl:template match="/InvoiceDetail/Order/OrderList/Order/ChargeTransactionDetails/ChargeTransactionDetail[@PaymentKey=$paymentKey and @ChargeType='AUTHORIZATION']" />

	
</xsl:stylesheet>