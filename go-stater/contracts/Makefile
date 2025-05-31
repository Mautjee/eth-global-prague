#!/usr/bin/env gmake

include ../common.mk

.PHONY: all MessageBox clean

all: MessageBox Virgil
	@printf "$(CYAN)*** Contracts built successfully!$(OFF)\n"

MessageBox:
	@printf "$(CYAN)*** Building contract: $(BLUE)MessageBox$(CYAN)...$(OFF)\n"
	@$(MAKE) -C message-box

Virgil:
	@printf "$(CYAN)*** Building contract: $(BLUE)Virgil$(CYAN)...$(OFF)\n"
	@$(MAKE) -C virgil
	
clean:
	@printf "$(CYAN)*** Cleaning up...$(OFF)\n"
	@$(MAKE) -C message-box clean
	@$(MAKE) -C virgil clean

